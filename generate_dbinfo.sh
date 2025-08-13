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

# Set last version of the glossary
versionGlossary=202508132306

# Set last version of the glossary
versionRecommendations=0

# Initialize an empty string variable to hold the full JSON output
json_output=""

# Start the JSON object - append with newlines
json_output+="{"
json_output+=$'\n'"  \"versionDB\": $version_db,"
json_output+=$'\n'"  \"versionGlossary\": $versionGlossary,"
json_output+=$'\n'"  \"versionRecommendations\": $versionRecommendations,"
json_output+=$'\n'"  \"images\": ["

# Loop through the 'files' array to format each filename as a JSON string.
# We use a counter 'i' to correctly handle commas for all elements except the last one.
for (( i=0; i<${#files[@]}; i++ )); do
    # Get the current filename
    filename="${files[i]}"

    # Append a comma and newline before each item, except the first one
    if [ $i -gt 0 ]; then
        json_output+=","
    fi
    json_output+=$'\n'

    # Append the filename enclosed in double quotes, with indentation
    # Use printf with command substitution to format the string, then append it
    formatted_filename=$(printf "    \"%s\"" "$filename")
    json_output+="$formatted_filename"
done

# End the "images" array and then the main JSON object
json_output+=$'\n'"  ]"
json_output+=$'\n'"}"

# Save a backup of the previous dbinfo.json
cp static/dbinfo.json ./dbinfo.json.bck

# Move the temporary file to the final dbinfo.json
echo "$json_output" > ./static/dbinfo.json

# Restore stdout to the terminal (optional, but good practice if more script follows)
#exec > /dev/tty

echo "JSON data saved to dbinfo.json with version: $version_db" > /dev/tty
