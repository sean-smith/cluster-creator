#!/bin/bash


export cluster_template="$(cat cluster-template.yml | base64 | xargs)"	
cdk deploy --parameters APIStack=pcluster-api --parameters ClusterName=hpc-cluster --parameters ConfigFile=${cluster_template} --parameters SubnetId='subnet-3497c518' --parameters KeyName='amzn2'
