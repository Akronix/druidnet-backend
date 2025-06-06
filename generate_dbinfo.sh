#!/bin/bash

# json_file_list.sh
# This script internally executes 'ls -1' to get a list of filenames
# in the current directory and outputs them as a JSON array of strings.
#
# Usage:
#   ./generate_dbinfo.sh

# Get the list of files using 'ls -1' and store each line in an array.
# The 'mapfile' command (or 'readarray') is used to read lines into an array.
# We use 'tr -d "\r"' to handle potential carriage return characters
# that might be present on some systems, ensuring clean lines.
img_directory="./static/images"

mapfile -t files < <(ls -1 $img_directory | tr -d "\r")

# Get the current date and time in YYYYMMDDHHMM format for versionDB
# This will be used as the value for "versionDB"
version_db=$(date +%Y%m%d%H%M)

# Save a backup of the previous dbinfo.json
cp static/dbinfo.json ./dbinfo.json.bck

# Redirect all subsequent echo/printf commands to the dbinfo.json file
# If the file exists, it will be overwritten.
exec > ./static/dbinfo.json

# Start the JSON object
echo "{"
echo "  \"versionDB\": $version_db,"
echo "  \"images\": ["

# Loop through the 'files' array to format each filename as a JSON string.
# We use a counter 'i' to correctly handle commas for all elements except the last one.
for (( i=0; i<${#files[@]}; i++ )); do
    # Get the current filename
    filename="${files[i]}"

    # Print a comma and newline before each item, except the first one
    if [ $i -gt 0 ]; then
        echo ","
    fi

    # Print the filename enclosed in double quotes, with indentation
    printf "    \"%s\"" "$filename"
done

# End the "images" array and then the main JSON object
echo "" # Add a newline after the last item for cleaner output
echo "  ]"
echo "}"

# Restore stdout to the terminal (optional, but good practice if more script follows)
#exec > /dev/tty

echo "JSON data saved to dbinfo.json with version: $version_db" > /dev/tty
