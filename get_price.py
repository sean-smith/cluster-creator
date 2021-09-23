import boto3
import json
import pprint
import ast
import yaml

client = boto3.client('pricing')

def get_aws_pricing(ec2_instance_type):

    pricing = {}
    response = client.get_products(
        ServiceCode='AmazonEC2',
        Filters=[
            {
                'Type': 'TERM_MATCH',
                'Field': 'usageType',
                'Value': 'BoxUsage:' + ec2_instance_type
            },
        ],

    )
    for data in response['PriceList']:
        data = ast.literal_eval(data)
        for k, v in data['terms'].items():
            if k == 'OnDemand':
                for skus in v.keys():
                    for ratecode in v[skus]['priceDimensions'].keys():
                        instance_data = v[skus]['priceDimensions'][ratecode]
                        if 'on demand linux ' + str(ec2_instance_type) + ' instance hour' in instance_data['description'].lower():
                            pricing['ondemand'] = float(instance_data['pricePerUnit']['USD'])
            else:
                for skus in v.keys():
                    if v[skus]['termAttributes']['OfferingClass'] == 'standard' \
                            and v[skus]['termAttributes']['LeaseContractLength'] == '1yr' \
                            and v[skus]['termAttributes']['PurchaseOption'] == 'No Upfront':
                        for ratecode in v[skus]['priceDimensions'].keys():
                            instance_data = v[skus]['priceDimensions'][ratecode]
                            if 'Linux/UNIX (Amazon VPC)' in instance_data['description']:
                                pricing['1yreserved'] = float(instance_data['pricePerUnit']['USD'])


    return pricing





with open("_data/instances.yml", "r") as stream:
    try:
        price_file = {}
        instances = yaml.safe_load(stream)
        for instance in instances:
            prices = get_aws_pricing(instance.get('name'))
            price_file[instance.get('name')] = prices
        with open('prices.yml', 'w') as outfile:
            yaml.dump(price_file, outfile)
    except yaml.YAMLError as exc:
        print(exc)