# copied from my own nexmania engine
# will be readjusted later

from random import shuffle
from sys import argv
song_id = argv[1]
song_diff = argv[2]
chart = ''

with open(f'res/songs/{song_id}/{song_diff}.sm', 'r') as file:
    lines = file.readlines()
    lines = [x.strip() for x in lines]
    measures = [[]]
    for line in lines:
        if line == ',':
            measures.append([])
        else:
            measures[-1].append(line)

    arrangement = [0,1,2,3,4,5]
    for i in range(len(measures)):
        measure = measures[i]
        lm = len(measure)
        for j in range(lm):
            notes = [n for n in measure[j]]
            last_element = ''
            for k in range(len(notes)):
                note = notes[k]
                note_element = f'{i} {j} {lm}; note {arrangement[k]} tap'
                if note == '1' and note_element != last_element:
                    chart += f'{note_element}\n'
                    last_element = note_element

print(chart)
with open(f'res/songs/{song_id}/{song_diff}.libeat', 'w') as file:
    file.write(chart)