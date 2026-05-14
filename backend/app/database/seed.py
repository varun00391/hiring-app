import logging

from sqlalchemy import func, select

from app.core.security import hash_password
from app.models import Candidate, CandidateStage, Role, RoleName, User

logger = logging.getLogger(__name__)

# Single demo password keeps admin + TAG logins predictable (avoid 401 confusion).
_SEED_LOGIN_PASSWORD = "admin123"

_TAG_DEMO_ACCOUNTS = (
    ("alex.morgan.tag@example.com", "Alex Morgan", "Technical Recruiting"),
    ("jordan.lee.tag@example.com", "Jordan Lee", "Talent Partner"),
)

_ADMIN_EMAIL = "admin@gmail.com"


async def bootstrap(session) -> None:
    role_exists = await session.scalar(select(func.count()).select_from(Role))
    if not role_exists:
        admin_role = Role(name=RoleName.admin.value)
        tag_role = Role(name=RoleName.tag_member.value)
        session.add_all([admin_role, tag_role])
        await session.flush()

        admin = User(
            email=_ADMIN_EMAIL,
            full_name="HireBot Admin",
            hashed_password=hash_password(_SEED_LOGIN_PASSWORD),
            role_id=admin_role.id,
            specialization=None,
        )
        tag_users = [
            User(
                email=email,
                full_name=name,
                hashed_password=hash_password(_SEED_LOGIN_PASSWORD),
                role_id=tag_role.id,
                specialization=spec,
            )
            for email, name, spec in _TAG_DEMO_ACCOUNTS
        ]
        session.add(admin)
        session.add_all(tag_users)
        await session.flush()

        demo = Candidate(
            public_id="HB-DEMO001",
            full_name="Casey Rivera",
            email="casey.rivera@example.com",
            applied_role="Senior Backend Engineer",
            experience_years=6.5,
            current_stage=CandidateStage.interview_scheduled,
            ai_match_score=88.5,
            recruiter_id=admin.id,
            assigned_tag_id=tag_users[0].id,
            status="Active",
            parsed_metadata={"pipeline": "hirebot"},
            skills=["python", "fastapi", "postgresql", "aws"],
            education=[
                {"degree": "MS Computer Science", "institution": "State Polytechnic", "year": "2019"},
            ],
            work_experience=[
                {"title": "Staff Engineer", "company": "Acme Payments", "duration": "2021–Present"},
            ],
            projects=[{"name": "Realtime Clearing", "description": "Kafka + Rust ingestion"}],
            linkedin_url="https://linkedin.com/in/example-casey",
        )
        session.add(demo)
        await session.commit()
        logger.info("Inserted baseline HireBot roles, users, and demo candidate.")

    await ensure_demo_tag_accounts(session)


async def ensure_demo_tag_accounts(session) -> None:
    """Create missing seeded TAG users (e.g. DB had roles from a migration but skipped user seed)."""

    tag_role_id = await session.scalar(select(Role.id).where(Role.name == RoleName.tag_member.value))
    if not tag_role_id:
        return

    inserted = False
    for email, full_name, spec in _TAG_DEMO_ACCOUNTS:
        exists = await session.scalar(select(func.count()).select_from(User).where(User.email == email.lower()))
        if exists:
            continue
        session.add(
            User(
                email=email.lower(),
                full_name=full_name,
                hashed_password=hash_password(_SEED_LOGIN_PASSWORD),
                role_id=tag_role_id,
                specialization=spec,
            )
        )
        inserted = True
        logger.info("Repaired missing demo TAG login: %s", email)

    if inserted:
        await session.commit()


async def unify_demo_passwords(session) -> None:
    """Optional dev: reset seeded accounts to `_SEED_LOGIN_PASSWORD`. Enable via Settings."""
    from app.core.config import get_settings
    from app.repositories import user_repository

    if not get_settings().unify_demo_passwords:
        return

    hashed = hash_password(_SEED_LOGIN_PASSWORD)
    emails = (_ADMIN_EMAIL, *(e for e, _, __ in _TAG_DEMO_ACCOUNTS))
    altered = False
    for email in emails:
        user = await user_repository.get_user_by_email(session, email.lower())
        if user:
            user.hashed_password = hashed
            session.add(user)
            altered = True
    if altered:
        await session.commit()
        logger.info("Unified demo passwords (UNIFY_DEMO_PASSWORDS=true)")
