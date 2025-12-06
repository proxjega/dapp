# Išmanioji sutartis ir decentralizuota aplikacija

Šioje repozitorije bus pateikti būsto pirkimo išmanioji sutartis ir decentralizuota aplikacija

## Verslo logika
Yra 3 šalis: Pardavėjas, nekilnojamo turto agentas, pirkėjas

![alt text](image.png)

- Pardavėjas - sukuria pardavimo pasiūlymą, priima/atmeta pasiūlyta agento kainą
- Agentas - įvertina būstą, siunčia kainą pardavėjui, randa pirkėja, siūlo jam būstą
- Pirkėjas - sutinka arba atmeta pasiūlymą, moka.  

Jei pirkėjas sutiko - Pardavėjas gauna pinigus, agentas - komisija už paslaugą, pirkėjas - būtą.  Jei ne - pirkėjas atmetamas, ir agentui reikia ieškoti naujo pirkėjo.
#### Šioje išmaniojoje sutartyje panaudota praktika "Pull over push" - kai pirkėjas pervedė lėšas, išmanioji sutartis neperveda jas pardavėjui ir agentui. Jiems reikia išvesti lėšas patiems, pasinaudojant metodu "getFunds".

## Išmanioji sutartis
Parašyta naudojant Solidity kalbą. Pilna išmaniąją sutartį galima rasti aplanke **contracts**.
