# ampower.pl

Strona firmowa **AmPower — Jakub Babiej** (instalacje elektryczne, klimatyzacja, alarmy, monitoring).

Cała strona to jeden samodzielny plik `index.html` — czcionki i zdjęcia są osadzone
bezpośrednio w pliku, więc nie ma żadnych zewnętrznych zależności.

## Publikacja

Hosting: GitHub Pages. Każdy `git push` na gałąź `main` publikuje zmiany na https://ampower.pl
(zwykle w ciągu 1–2 minut).

```sh
git add -A && git commit -m "opis zmiany" && git push
```

Plik `CNAME` przypina domenę ampower.pl — nie usuwać.
