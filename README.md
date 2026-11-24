# BolKhata - Prototype v1

Voice-first khata for kirana shopkeepers. Bolte jao, khata banta jao.


## How to run
1. Open this folder in VS Code.
2. Open `index.html` in Chrome (double-click, or right-click > Open With Chrome).
3. Allow microphone when Chrome asks.
4. Best in Chrome on Mac - Web Speech API works best there.

## How to demo (60 seconds)
1. Tap the big red mic button and say: "Ramesh ko 2 kilo atta, 90 rupaye udhaar"
2. App speaks back: "Ramesh, udhaar 90 rupaye, total 1,240 rupaye. Sahi hai?"
3. Say "Haan" or tap "Haan, Sahi Hai". Entry saves.
4. Tap demo button "Ramesh ka total?" - app speaks the total.
5. Tap "Aaj ka udhaar batao" - app reads the full list aloud.

No mic? Use the Demo buttons. They work exactly like voice input.

## Voice commands it understands
- Add udhaar: "Ramesh ko 2 kilo atta, 90 rupaye udhaar"
- Payment: "Ramesh ne 500 rupaye de diye"
- Total: "Ramesh ka total kitna hai"
- Summary: "Aaj ka udhaar batao"
- Yes / No: "Haan, sahi hai" / "Nahi, galat hai"

## Safety rules in the prototype
- Nothing saves without confirmation. Amount above Rs 1,000 always asks again.
- If voice is unclear, it says "Phir se bolo, awaaz saaf nahi aayi" and does not guess.
- If name is Ramesh vs Rakesh, it asks "Ramesh ya Rakesh?"
- Offline: entries save on the phone (localStorage) and show "Offline save ho gaya".
- Delete is never by voice alone.

## Files
- index.html - screens, mic button, ledger, reminders
- style.css - mobile-first, large text, high contrast
- app.js - voice parsing, Hindi TTS/STT, ledger logic, localStorage

## Sample data (reset with Reset demo data button)
- Ramesh - total due Rs 1,240
- Rakesh - total due Rs 850
- Suresh - total due Rs 420

## Next steps for the startup
1. Validate with 10 real kiranas near Ghaziabad.
2. Pilot 30 days with 5-10 shops.
3. Charge Rs 99/month after pilot works.
