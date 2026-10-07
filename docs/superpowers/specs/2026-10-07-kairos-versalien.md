# KAIROS Font – übrige Versalien (M2, Teil 1)

| | |
|---|---|
| Datum | 2026-10-07 |
| Grundlage | Spec `2026-10-06-kairos-font-design.md` (§3: Glyphen konstruiert Claude, Abnahme per Sichtprüfung durch Hagen) |
| Umfang | B J M P Q R S T U V W X Y Z, Ö Ü ẞ |
| Status | Entwurf zur Sichtprüfung |

Ziffern, Satzzeichen, Font-Build, `calt`, Namens-Ligatur und Monogramm bleiben beim Rest von M2 (eigene Spec).

## Bauprinzipien

- **Knoten auf den Balkenlinien:** B P R W X Y treffen sich auf der oberen Linie (wie E F H K), M auf der unteren (wie das A). Der Griff „Balken“ schaltet je Buchstabe um.
- **Bögen aus dem Vorrat der Vorlage:** Halbkreis des O (U, J, Q), Ecke und Schwung des C (S-Kopf), Segel des D (B unten, S-Fuß, ẞ).
- **Bäuche von P, R und B oben rund**, Rundung höchstens halbe Höhe und halbe Breite.
- **Schräge Enden** laufen knapp über Ober- und Grundlinie hinaus, der Renderer schneidet sie waagrecht ab (wie A und K).
- **Umlautpunkte** liegen wie beim Ä auf der Oberlinie und im Buchstabenfeld: Ü in der Öffnung, Ö in den freien oberen Ecken, mit `armGap` Abstand zum Bogen.
- **Abstände** kommen aus den Tintenprofilen; LT, AV, TA, PJ usw. rücken dadurch von selbst zusammen.

## Zeichen

| Zeichen | Form | Verbindungen |
|---|---|---|
| B | Stamm, runder Bauch bis zur oberen Linie, darunter Segel wie beim D | Stamm teilen |
| J | rechter Stamm, Halbkreis-Haken bis zur unteren Linie | keine (J + U würde zu „ɯ“) |
| M | senkrechte Stämme, V mit flacher Spitze auf der unteren Linie | Stamm teilen |
| P | Stamm, runder Bauch bis zur oberen Linie | Stamm teilen |
| Q | O mit waagrechtem Schwanz auf der Grundlinie | Fuß; der Fuß-Griff verlängert den Schwanz |
| R | wie P, Bein vom Stamm aus wie beim K | Stamm teilen, Füße teilen (RA) |
| S | Kopf wie beim C, Schwung, Fuß wie beim D | keine |
| T | Arm, Stamm in der Mitte | Arm mündet oben in den Nachbarstamm (TH, TE) |
| U | zwei Stämme, Halbkreis unten | Stamm teilen |
| V | A umgedreht, flache Spitze unten | keine |
| W | M umgedreht, Spitze auf der oberen Linie | Stamm teilen |
| X | Kreuzung auf der oberen Linie | keine |
| Y | Arme treffen sich auf der oberen Linie, Stamm darunter | keine |
| Z | Arm, Diagonale, Fuß | Fuß unterfährt (ZA) |
| Ö | O, Punkte in den oberen Ecken | keine |
| Ü | U, Punkte in der Öffnung | Stamm teilen |
| ẞ | Stamm, Dach, Schräge zur oberen Linie, Segel | Stamm teilen |

Dazu:

- K bekommt das Fuß-Andocken des R: KA teilt die Füße.
- Die Eingabe „ß“ wird zu „ẞ“.
- Das Verbindungs-Menü heißt bei der Bogen-Verbindung jetzt „Strich teilen (Bogen/Arm)“.

## Bewusst anders als zuerst skizziert

| Skizze | Jetzt | Grund |
|---|---|---|
| T verschachtelt den Nachbarn unter dem Arm | Arm mündet in den Nachbarstamm (Regel c) | Verschachteln wählte die Engine fast immer; Ketten wie „TTE“ wurden zu Treppen |
| Bäuche von P, R und B als kleines Segel | rund | das kleine Segel wirkte wie ein Wimpel |
| S mit waagrechter Taille auf der oberen Linie | Schwung von der C-Ecke zur D-Ecke | die Taille las sich als „5“ |
| Ö-Punkte im Innenraum | in den oberen Ecken | im Innenraum wirken sie wie Augen |

## Prüfung

- Automatisch: alle Zeichen sind entworfen; die Tinte bleibt bei allen Reglerwerten im Buchstabenfeld; die Andockstellen stimmen; die Knoten verbinden nicht mit Nachbarn; die Ö-Punkte halten `armGap` zum Bogen; TH endet genau auf dem Stamm; ß wird zu ẞ.
- Sichtprüfung durch Hagen: Prüfblätter `out/glyphen*.png` und Wörter in der App.
