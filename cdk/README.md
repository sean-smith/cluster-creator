# Cluster Creator

This is a cdk/cfn stack. I use python and cdk to test and generate the stack then I do some black magic to make it a static template so it can be used on https://cluster-creator.swsmith.cc

To make modifications to the stack, edit the files:

```bash
# cdk stack
cluster_creator/cluster_creator_stack.py
# lambda function 
cluster_creator/lambda/api.py
```

Then test it locally with the following code, this should live in the `cluster_creator/lambda` directory:

```python
from api import create, list_clusters, substitute_vars
from pprint import pprint

if __name__ == "__main__":
    f = open("../../cluster-template.yml", "r")
    config = f.read()
    baseurl = "https://qadcjxxjbg.execute-api.us-east-1.amazonaws.com/prod"
    cluster_name = "test3"
    subnet_id = 'subnet-3497c518'
    key_name = 'amzn2'
    list_clusters("us-east-1", baseurl)
    config = substitute_vars(config, key_name=key_name, subnet_id=subnet_id)
    pprint(config)
    create("us-east-1", baseurl, cluster_name, config)
```

Once you're sure it works and you're ready to deploy run:

```bash
make deploy
```

Now change the following sections in `template.yml`

```diff
-  AssetParametersc691172cdeefa2c91b5a2907f9d81118e47597634943344795f1a844192dd49cS3BucketEAC9DD43:
-    Type: String
-    Description: S3 bucket for asset "c691172cdeefa2c91b5a2907f9d81118e47597634943344795f1a844192dd49c"
-  AssetParametersc691172cdeefa2c91b5a2907f9d81118e47597634943344795f1a844192dd49cS3VersionKeyDD9AE9E7:
-    Type: String
-    Description: S3 key for asset version "c691172cdeefa2c91b5a2907f9d81118e47597634943344795f1a844192dd49c"
-  AssetParametersc691172cdeefa2c91b5a2907f9d81118e47597634943344795f1a844192dd49cArtifactHash627DAAA7:
-    Type: String
-    Description: Artifact hash for asset "c691172cdeefa2c91b5a2907f9d81118e47597634943344795f1a844192dd49c"
```

```diff
-        S3Bucket:
-          Ref: AssetParametersc691172cdeefa2c91b5a2907f9d81118e47597634943344795f1a844192dd49cS3BucketEAC9DD43
-        S3Key:
-          Fn::Join:
-            - ""
-            - - Fn::Select:
-                  - 0
-                  - Fn::Split:
-                      - "||"
-                      - Ref: AssetParametersc691172cdeefa2c91b5a2907f9d81118e47597634943344795f1a844192dd49cS3VersionKeyDD9AE9E7
-              - Fn::Select:
-                  - 1
-                  - Fn::Split:
-                      - "||"
-                      - Ref: AssetParametersc691172cdeefa2c91b5a2907f9d81118e47597634943344795f1a844192dd49cS3VersionKeyDD9AE9E7
+        S3Bucket: cluster-creator
+        S3Key: cdk.zip
```

Then test the stack by testing the file `template.yml`.

Next once you're sure it works, deploy with:

```make
make template
```