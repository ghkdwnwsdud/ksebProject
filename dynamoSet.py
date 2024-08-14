import boto3

# AWS key, region info
aws_access_key_id = 'AWS_ACCESS_KEY'
aws_secret_access_key = 'AWS_SECRET_ACCESS_KEY'
region_name = 'ap-northeast-2'

# DynamoDB Connection
dynamodb = boto3.resource(
    'dynamodb', 
    region_name = region_name,
    aws_access_key_id = aws_access_key_id,
    aws_secret_access_key = aws_secret_access_key
)

# DynamoDB table select
table_name = 'SharedVariable'
table = dynamodb.Table(table_name)

# Initialize variables
def initialize_variables():
    item = {
        'variables': 'stateVar',
        'pre_st_count': 0,
        'pre_b_count': 0,
        'pre_out_count': 0,
        'swing_count': -1,
        'pitching_count': -1,
        'state': None,
        'game_start': False,
        'state_frame_count': 0,
        'now_frame_count': 0,
        'pre_1_base': False,
        'pre_2_base': False,
        'pre_3_base': False,
        'tag_count': -1,
        'tag': {
            '타석': False,
            '피칭': 0,
            '스윙': 0,
            '판정': None,
            '아웃_카운트': 0,
            '볼_카운트': 0,
            '스트_카운트': 0,
            '1루': False,
            '2루': False,
            '3루': False,
            'flag': 0
        }
    }
    table.put_item(Item=item)

# Update variable
def update_state(key, value):
    table.update_item(
        Key={'variables': 'stateVar'},
        UpdateExpression=f'SET {key} = :val',
        ExpressionAttributeValues={':val': value}
    )

# Update 'tag' dictionary
def update_tag_field(field_name, value):
    table.update_item(
        Key={'variables': 'stateVar'},
        UpdateExpression=f'SET tag.{field_name} = :val',
        ExpreessionAttributeValues={':val': value}
    )

# Get variable
def get_state(key):
    response = table.get_item(
        Key={'variables': 'stateVar'}
    )
    return response['Item'].get(key)


initialize_variables()


####TESTING####
'''
# Get all variables
def get_all_variables():
    response = table.get_item(
        Key={'variables': 'stateVar'}
    )
    item = response.get('Item', {})
    return item

# Print all variables
def print_all_variables():
    item = get_all_variables()
    if item:
        print("Current state of variables:")
        for key, value in item.items():
            print(f"{key}: {value}")
    else:
        print("No item found")

print_all_variables()
'''
'''
update_tag_field('타석', True)

before_pre_st_count = get_state('pre_st_count')
print(f"value: {before_pre_st_count}")
# Update Test
update_state('pre_st_count', 1)
update_state('pre_1_base', True)

# Get test
current_pre_st_count = get_state('pre_st_count')
print(f"updated value: {current_pre_st_count}")
'''

