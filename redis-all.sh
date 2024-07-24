#!/bin/bash

# Check if redis-cli is available
if ! command -v redis-cli &> /dev/null; then
    echo "redis-cli command not found. Please install Redis CLI."
    exit 1
fi

# Get all keys
keys=$(redis-cli KEYS '*')

if [ -z "$keys" ]; then
    echo "No keys found."
    exit 0
fi

# Iterate over each key
for key in $keys; do
    # Get the type of the key
    type=$(redis-cli TYPE "$key")

    echo "Key: $key, Type: $type"

    case $type in
        string)
            # Get the value of the string
            value=$(redis-cli GET "$key")
            echo "Value: $value"
            ;;
        list)
            # Get all elements from the list
            values=$(redis-cli LRANGE "$key" 0 -1)
            echo "Values: $values"
            ;;
        set)
            # Get all members from the set
            values=$(redis-cli SMEMBERS "$key")
            echo "Members: $values"
            ;;
        hash)
            # Get all fields and values from the hash
            fields=$(redis-cli HGETALL "$key")
            echo "Fields and Values:"
            while IFS= read -r field && IFS= read -r value; do
                echo "  $field: $value"
            done <<< "$fields"
            ;;
        zset)
            # Get all members and scores from the sorted set
            members=$(redis-cli ZRANGE "$key" 0 -1 WITHSCORES)
            echo "Members and Scores:"
            echo "$members"
            ;;
        *)
            echo "Key $key is of type $type and is not handled by this script."
            ;;
    esac

    echo "-------------------"
done
