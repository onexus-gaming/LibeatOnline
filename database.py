# eliminates the need for a custom server
# therefore runs without problems on github pages

import os, json

database = {}

for song in os.listdir('res/songs'):
    if not song.startswith('_') and os.path.isdir(f'res/songs/{song}'):
        print(song, end=': ')
        with open(f'res/songs/{song}/meta.json', 'r') as f:
            database[song] = json.load(f)
        print(database[song])

with open('res/songs/database.json', 'w') as f:
    json.dump(database, f)
