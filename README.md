# Skribb.io Word Dumper
This script is a tool which attempts to find all possible words for Skribbl.io

## How does it work?
In skribbl.io, the drawer is given a predetermined list of words which they can draw. The amount of words is determined by the WordCount and WordMode settings. This script creates two bot players in a private lobby that quickly alternate between the drawer and guesser, and logs any words they are given to a file called `words.txt`. By setting WordCount to five and setting WordMode to combination, we can extract ten words every time either one of the bots are given the opportunity to draw. The words list is deduplicated, so you do not have to worry about the same word showing up multiple times.

## Language
By default, this script dumps all the words for English lobbies. You are free to change this by opening the `index.js` file in a text editor, and changing the line `language: Language.ENGLISH,` to include another language. A list of all valid languages can be found [here](https://github.com/Skribblers/skribbler/blob/main/src/constants.js#L31-L60).