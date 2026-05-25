### To get AZURE_CREDENTIALS

1. az login

2. get Subscription id using

az account show --query id -o tsv

3. Now use below command to get Azure credentials

az ad sp create-for-rbac \
  --name github-actions-sp \
  --role contributor \
  --scopes /subscriptions/<SUBSCRIPTION_ID> \
  --sdk-auth


### Generate Private key locally & use it 

ssh-keygen -t rsa -b 4096 -f ~/.ssh/hirebot_deploy -N ""