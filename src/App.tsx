import { useEffect, useMemo, useState } from 'react'
import './App.css'

type Goal = 'spiermassa' | 'vetverlies' | 'onderhoud'
type Level = 'beginner' | 'gemiddeld' | 'gevorderd'
type Diet = 'normaal' | 'vegetarisch' | 'lactosevrij'
type Location = 'gym' | 'thuis'
type Muscle =
  | 'borst'
  | 'rug'
  | 'schouders'
  | 'benen'
  | 'billen'
  | 'hamstrings'
  | 'quadriceps'
  | 'biceps'
  | 'triceps'
  | 'core'
  | 'kuiten'
  | 'full body'

type Profile = {
  weight: number
  goal: Goal
  days: 3 | 4 | 5 | 6
  level: Level
  diet: Diet
  location: Location
}

type Exercise = {
  id: string
  name: string
  primary: Muscle
  secondary: Muscle[]
  equipment: string
  sets: string
  reps: string
  rest: string
  purpose: string
  alternative: string
  technique: {
    start: string
    posture: string
    steps: string[]
    range: string
    breathing: string
    mistakes: string[]
    targetTips: string[]
    injuryTips: string[]
  }
}

type TrainingDay = {
  title: string
  focus: Muscle[]
  exercises: Exercise[]
  isRest?: boolean
}

type Recipe = {
  name: string
  description: string
  ingredients: string[]
  portion: string
  protein: number
  calories: number
  labels: Diet[]
}

const STORAGE_KEY = 'personal-gym-dashboard-profile'

const defaultProfile: Profile = {
  weight: 82,
  goal: 'spiermassa',
  days: 4,
  level: 'gemiddeld',
  diet: 'normaal',
  location: 'gym',
}

const muscleLabels: Record<Muscle, string> = {
  borst: 'Borst',
  rug: 'Rug',
  schouders: 'Schouders',
  benen: 'Benen',
  billen: 'Billen',
  hamstrings: 'Hamstrings',
  quadriceps: 'Quadriceps',
  biceps: 'Biceps',
  triceps: 'Triceps',
  core: 'Core',
  kuiten: 'Kuiten',
  'full body': 'Full body',
}

const dayTemplates: Record<Profile['days'], { title: string; focus: Muscle[] }[]> = {
  3: [
    { title: 'Dag 1 - Full body kracht', focus: ['benen', 'borst', 'rug', 'core'] },
    { title: 'Dag 2 - Full body volume', focus: ['rug', 'schouders', 'billen', 'biceps'] },
    { title: 'Dag 3 - Full body techniek', focus: ['benen', 'borst', 'hamstrings', 'triceps'] },
  ],
  4: [
    { title: 'Dag 1 - Upper push', focus: ['borst', 'schouders', 'triceps'] },
    { title: 'Dag 2 - Lower body', focus: ['quadriceps', 'hamstrings', 'billen', 'kuiten'] },
    { title: 'Dag 3 - Upper pull', focus: ['rug', 'biceps', 'schouders'] },
    { title: 'Dag 4 - Lower en core', focus: ['benen', 'billen', 'core'] },
  ],
  5: [
    { title: 'Dag 1 - Push', focus: ['borst', 'schouders', 'triceps'] },
    { title: 'Dag 2 - Pull', focus: ['rug', 'biceps'] },
    { title: 'Dag 3 - Legs', focus: ['quadriceps', 'hamstrings', 'billen', 'kuiten'] },
    { title: 'Dag 4 - Upper hypertrofie', focus: ['borst', 'rug', 'schouders'] },
    { title: 'Dag 5 - Lower en core', focus: ['benen', 'billen', 'core'] },
  ],
  6: [
    { title: 'Dag 1 - Push zwaar', focus: ['borst', 'schouders', 'triceps'] },
    { title: 'Dag 2 - Pull zwaar', focus: ['rug', 'biceps'] },
    { title: 'Dag 3 - Legs zwaar', focus: ['quadriceps', 'hamstrings', 'billen'] },
    { title: 'Dag 4 - Push volume', focus: ['borst', 'schouders', 'triceps'] },
    { title: 'Dag 5 - Pull volume', focus: ['rug', 'biceps', 'core'] },
    { title: 'Dag 6 - Legs volume', focus: ['benen', 'billen', 'kuiten', 'core'] },
  ],
}

const weeklyLabels = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']

const gymExercises: Exercise[] = [
  {
    id: 'barbell-bench-press',
    name: 'Barbell bench press',
    primary: 'borst',
    secondary: ['schouders', 'triceps'],
    equipment: 'Barbell, bench',
    sets: '3-4',
    reps: '6-10',
    rest: '120 sec',
    purpose: 'Basisbeweging voor kracht en spiermassa in borst, voorste schouder en triceps.',
    alternative: 'Geen vrije bank vrij? Gebruik chest press machine of dumbbell press.',
    technique: {
      start: 'Ga liggen met ogen onder de stang, voeten stevig op de vloer en billen op de bank.',
      posture: 'Trek je schouderbladen naar achteren en omlaag, borst licht omhoog en polsen recht boven je ellebogen.',
      steps: [
        'Pak de stang iets breder dan schouderbreedte.',
        'Laat de stang gecontroleerd zakken richting onderkant borst.',
        'Houd ellebogen ongeveer 45 tot 70 graden van je romp.',
        'Duw de stang omhoog zonder schouders naar voren te laten rollen.',
      ],
      range: 'Zak tot de stang licht de borst raakt of tot je schouders comfortabel blijven.',
      breathing: 'Adem in tijdens het zakken, span je core aan en adem uit voorbij het zwaarste punt omhoog.',
      mistakes: ['Stuiteren op de borst', 'Schouders optrekken', 'Polsen achterover laten knikken'],
      targetTips: ['Denk aan je bovenarmen naar elkaar toe duwen', 'Houd spanning tussen schouderbladen en bank'],
      injuryTips: ['Gebruik een spotter bij zware sets', 'Stop als je scherpe schouderpijn voelt'],
    },
  },
  {
    id: 'lat-pulldown',
    name: 'Lat pulldown',
    primary: 'rug',
    secondary: ['biceps', 'schouders'],
    equipment: 'Lat pulldown machine',
    sets: '3-4',
    reps: '8-12',
    rest: '90 sec',
    purpose: 'Bouwt breedte in de rug en leert je de lats aanspannen.',
    alternative: 'Geen machine? Doe assisted pull-ups of cable straight-arm pulldowns.',
    technique: {
      start: 'Zet de knierol strak, pak de stang iets breder dan schouderbreedte en zit rechtop.',
      posture: 'Borst hoog, ribben onder controle, schouders laag en nek lang.',
      steps: [
        'Start door je schouderbladen omlaag te trekken.',
        'Trek ellebogen naar je zijzakken in plaats van met je handen te trekken.',
        'Breng de stang tot bovenkant borst.',
        'Laat de stang rustig terug omhoog zonder spanning te verliezen.',
      ],
      range: 'Volledig strekken bovenin zonder je schouders naar je oren te laten schieten.',
      breathing: 'Adem uit tijdens het trekken, adem in tijdens de gecontroleerde terugweg.',
      mistakes: ['Achterover leunen en momentum gebruiken', 'Stang achter de nek trekken', 'Biceps dominant maken'],
      targetTips: ['Denk aan je oksels naar beneden trekken', 'Pauzeer kort onderin'],
      injuryTips: ['Houd je onderrug neutraal', 'Forceer geen diepe positie achter de nek'],
    },
  },
  {
    id: 'leg-press',
    name: 'Leg press',
    primary: 'quadriceps',
    secondary: ['billen', 'hamstrings', 'kuiten'],
    equipment: 'Leg press machine',
    sets: '3-4',
    reps: '10-15',
    rest: '120 sec',
    purpose: 'Veilige zware beenoefening voor quadriceps en algemene beenkracht.',
    alternative: 'Geen leg press? Doe goblet squats of smith machine squats.',
    technique: {
      start: 'Plaats voeten op heup- tot schouderbreedte op het platform.',
      posture: 'Houd onderrug en bekken tegen de zitting, knieën in lijn met tenen.',
      steps: [
        'Ontgrendel gecontroleerd en laat het platform zakken.',
        'Zak tot je knieën diep genoeg buigen zonder dat je bekken kantelt.',
        'Duw via middenvoet en hiel terug omhoog.',
        'Strek bovenin bijna volledig, maar vergrendel je knieën niet hard.',
      ],
      range: 'Gebruik een diepe, gecontroleerde range zolang je onderrug contact houdt.',
      breathing: 'Adem in omlaag, span je buik aan en adem uit tijdens het wegduwen.',
      mistakes: ['Knieën naar binnen laten vallen', 'Te diep zakken met bolle onderrug', 'Halve herhalingen te zwaar laden'],
      targetTips: ['Voeten lager voor meer quadriceps', 'Voeten hoger voor meer billen en hamstrings'],
      injuryTips: ['Begin met lichte opwarmsets', 'Houd knieën altijd dezelfde richting als tenen'],
    },
  },
  {
    id: 'seated-cable-row',
    name: 'Seated cable row',
    primary: 'rug',
    secondary: ['biceps', 'schouders'],
    equipment: 'Kabelstation',
    sets: '3',
    reps: '8-12',
    rest: '90 sec',
    purpose: 'Versterkt middenrug, lats en controle over schouderbladen.',
    alternative: 'Geen kabel? Doe chest-supported dumbbell rows.',
    technique: {
      start: 'Zit met lichte kniebuiging, pak de handgreep en maak je romp lang.',
      posture: 'Neutrale rug, borst open, schouders weg van je oren.',
      steps: [
        'Laat je armen volledig voor je strekken.',
        'Trek eerst je schouderbladen naar achteren.',
        'Breng de handgreep naar onderkant ribben.',
        'Laat gecontroleerd terug zonder naar voren te klappen.',
      ],
      range: 'Volledige stretch voorin en korte squeeze achterin.',
      breathing: 'Adem uit bij het trekken, adem in op de terugweg.',
      mistakes: ['Heen en weer zwaaien met romp', 'Schouders optrekken', 'Polsen buigen om extra te trekken'],
      targetTips: ['Trek ellebogen langs je lichaam', 'Knijp een seconde tussen je schouderbladen'],
      injuryTips: ['Vermijd achterover gooien', 'Houd buikspanning gedurende de hele set'],
    },
  },
  {
    id: 'dumbbell-shoulder-press',
    name: 'Dumbbell shoulder press',
    primary: 'schouders',
    secondary: ['triceps', 'core'],
    equipment: 'Dumbbells, bench',
    sets: '3',
    reps: '8-12',
    rest: '90 sec',
    purpose: 'Ontwikkelt schouderkracht en controle boven het hoofd.',
    alternative: 'Geen dumbbells? Gebruik machine shoulder press.',
    technique: {
      start: 'Zit rechtop met dumbbells naast je schouders en voeten stevig op de grond.',
      posture: 'Ribben laag, core aangespannen, onderarmen verticaal.',
      steps: [
        'Duw de dumbbells omhoog in een lichte boog naar elkaar toe.',
        'Houd ellebogen iets voor je lichaam.',
        'Laat gecontroleerd terug tot schouderhoogte.',
        'Blijf stabiel zonder hol te trekken in je onderrug.',
      ],
      range: 'Van schouderhoogte tot bijna gestrekte armen bovenin.',
      breathing: 'Adem in omlaag, adem uit tijdens het drukken.',
      mistakes: ['Onderug overstrekken', 'Elleboog te ver achter de romp', 'Dumbbells laten botsen bovenin'],
      targetTips: ['Denk aan omhoog en iets naar binnen duwen', 'Houd spanning op de zijkant van je schouders'],
      injuryTips: ['Gebruik geen pijnlijke range', 'Kies een gewicht dat je zonder momentum controleert'],
    },
  },
  {
    id: 'romanian-deadlift',
    name: 'Romanian deadlift',
    primary: 'hamstrings',
    secondary: ['billen', 'rug', 'core'],
    equipment: 'Barbell of dumbbells',
    sets: '3-4',
    reps: '8-10',
    rest: '120 sec',
    purpose: 'Versterkt heupscharnier, hamstrings en bilspieren.',
    alternative: 'Geen barbell? Doe dumbbell RDL of cable pull-through.',
    technique: {
      start: 'Sta heupbreed met gewicht voor je dijen en knieën licht gebogen.',
      posture: 'Rug neutraal, borst trots, schouderbladen rustig naar achteren.',
      steps: [
        'Duw je heupen naar achteren alsof je een deur sluit.',
        'Laat het gewicht dicht langs je benen zakken.',
        'Stop wanneer je hamstrings duidelijk rekken.',
        'Duw heupen naar voren en span billen aan om terug te komen.',
      ],
      range: 'Tot net onder knie of midden scheen, afhankelijk van mobiliteit zonder rug te bollen.',
      breathing: 'Adem in en brace voor je zakt, adem uit bovenin na het zwaarste punt.',
      mistakes: ['Squatten in plaats van heupscharnieren', 'Gewicht van het lichaam af laten gaan', 'Rug rond maken'],
      targetTips: ['Houd scheenbenen bijna verticaal', 'Voel rek achter je bovenbenen'],
      injuryTips: ['Begin licht om de hinge te leren', 'Stop de set als je onderrug het overneemt'],
    },
  },
  {
    id: 'cable-triceps-pressdown',
    name: 'Cable triceps pressdown',
    primary: 'triceps',
    secondary: ['core'],
    equipment: 'Kabelstation',
    sets: '3',
    reps: '10-15',
    rest: '60 sec',
    purpose: 'Isoleert triceps voor extra armvolume en lockout-kracht.',
    alternative: 'Geen kabel? Doe close-grip push-ups.',
    technique: {
      start: 'Sta dicht bij de kabel met ellebogen naast je romp.',
      posture: 'Borst open, schouders laag, polsen recht.',
      steps: [
        'Start met onderarmen iets boven parallel.',
        'Druk het touw of de stang omlaag door je ellebogen te strekken.',
        'Houd bovenarmen stil naast je lichaam.',
        'Laat gecontroleerd terug tot je triceps rekken.',
      ],
      range: 'Volledig strekken onderin en terug tot net voor spanning verdwijnt.',
      breathing: 'Adem uit tijdens het omlaag drukken, adem in omhoog.',
      mistakes: ['Elleboog naar voren laten bewegen', 'Schouders gebruiken', 'Te zwaar en halve reps doen'],
      targetTips: ['Spreid het touw onderin licht uit', 'Pauzeer kort in volledige strekking'],
      injuryTips: ['Houd polsen neutraal', 'Vermijd schokkende lockouts'],
    },
  },
  {
    id: 'dumbbell-curl',
    name: 'Dumbbell curl',
    primary: 'biceps',
    secondary: ['core'],
    equipment: 'Dumbbells',
    sets: '3',
    reps: '10-15',
    rest: '60 sec',
    purpose: 'Isoleert de biceps en helpt bij armvolume en trekkracht.',
    alternative: 'Geen dumbbells? Gebruik cable curls of een EZ-bar curl.',
    technique: {
      start: 'Sta rechtop met dumbbells naast je lichaam en handpalmen naar voren.',
      posture: 'Schouders laag, ellebogen dicht bij je romp, ribben laag en core licht aangespannen.',
      steps: [
        'Curl de dumbbells omhoog zonder je bovenarmen naar voren te zwaaien.',
        'Draai niet met je romp om momentum te maken.',
        'Knijp bovenin kort in je biceps.',
        'Laat langzaam zakken tot je armen bijna gestrekt zijn.',
      ],
      range: 'Van bijna volledige armstrekking tot maximale buiging zonder schouders op te trekken.',
      breathing: 'Adem uit tijdens omhoog curlen, adem in tijdens zakken.',
      mistakes: ['Heupen gebruiken om te zwaaien', 'Elleboog ver naar voren brengen', 'Te snel laten zakken'],
      targetTips: ['Houd je pink iets hoger dan je duim bovenin', 'Gebruik een tempo van twee tellen omlaag'],
      injuryTips: ['Houd polsen recht', 'Kies een gewicht waarbij je ellebogen stil blijven'],
    },
  },
  {
    id: 'cable-crunch',
    name: 'Cable crunch',
    primary: 'core',
    secondary: ['schouders'],
    equipment: 'Kabelstation',
    sets: '3',
    reps: '10-15',
    rest: '60 sec',
    purpose: 'Traint buikspieren met progressieve weerstand en gecontroleerde rompflexie.',
    alternative: 'Geen kabel? Doe weighted dead bugs of plank variations.',
    technique: {
      start: 'Kniel voor de kabel met het touw naast je hoofd en heupen stabiel.',
      posture: 'Houd je bekken licht achterover en voorkom dat je heupen naar achteren bewegen.',
      steps: [
        'Start met een lange romp en spanning op de kabel.',
        'Krul je ribben richting je bekken.',
        'Laat je ellebogen richting bovenbenen komen.',
        'Kom gecontroleerd terug zonder volledig te ontspannen.',
      ],
      range: 'Beweeg vanuit je romp, niet vanuit je heupen.',
      breathing: 'Adem krachtig uit tijdens het inkrullen, adem in tijdens terugkomen.',
      mistakes: ['Heupen naar achteren duwen', 'Alleen met armen trekken', 'Nek naar beneden forceren'],
      targetTips: ['Denk aan ribben sluiten richting bekken', 'Pauzeer onderin met buikspanning'],
      injuryTips: ['Gebruik geen gewicht dat je onderrug trekt', 'Houd de beweging langzaam en klein genoeg'],
    },
  },
  {
    id: 'machine-calf-raise',
    name: 'Machine calf raise',
    primary: 'kuiten',
    secondary: ['benen'],
    equipment: 'Calf raise machine',
    sets: '3-4',
    reps: '12-20',
    rest: '60 sec',
    purpose: 'Traint kuitspieren met controle in volledige lengte.',
    alternative: 'Geen machine? Doe single-leg dumbbell calf raises.',
    technique: {
      start: 'Plaats bal van je voet op de rand en houd knieën licht gebogen.',
      posture: 'Sta lang, core actief, gewicht gelijkmatig over grote teen en kleine teen.',
      steps: [
        'Laat je hakken rustig zakken tot je rek voelt.',
        'Duw jezelf zo hoog mogelijk op je tenen.',
        'Pauzeer bovenin kort.',
        'Laat langzaam zakken zonder te veren.',
      ],
      range: 'Volledige stretch onderin en maximale contractie bovenin.',
      breathing: 'Adem rustig door, forceer geen ademstop bij hoge reps.',
      mistakes: ['Stuiteren', 'Alle druk op buitenkant voet', 'Te weinig range'],
      targetTips: ['Denk aan omhoog duwen via je grote teen', 'Gebruik een langzaam tempo'],
      injuryTips: ['Bouw volume geleidelijk op', 'Stop bij achillespees-irritatie'],
    },
  },
]

const homeExercises: Exercise[] = [
  {
    id: 'push-up',
    name: 'Push-up',
    primary: 'borst',
    secondary: ['schouders', 'triceps', 'core'],
    equipment: 'Lichaamsgewicht',
    sets: '3-4',
    reps: '8-15',
    rest: '90 sec',
    purpose: 'Sterke basisoefening voor borst, triceps en rompstabiliteit.',
    alternative: 'Te zwaar? Doe incline push-ups met handen op bank of tafel.',
    technique: {
      start: 'Plaats handen iets breder dan schouders en voeten achter je in plankpositie.',
      posture: 'Span billen en buik aan, maak een rechte lijn van hoofd tot hakken.',
      steps: [
        'Schroef je handen licht naar buiten in de vloer.',
        'Laat borst gecontroleerd richting vloer zakken.',
        'Houd ellebogen schuin langs je lichaam.',
        'Duw de vloer weg tot je armen bijna gestrekt zijn.',
      ],
      range: 'Zak tot borst bijna de vloer raakt of tot je positie stabiel blijft.',
      breathing: 'Adem in tijdens zakken, adem uit tijdens omhoog duwen.',
      mistakes: ['Heupen laten doorzakken', 'Elleboog volledig zijwaarts', 'Hoofd naar voren steken'],
      targetTips: ['Denk aan bovenarmen naar elkaar toe bewegen', 'Pauzeer onderin kort'],
      injuryTips: ['Houd polsen onder schouders', 'Verhoog je handen als schouders gevoelig zijn'],
    },
  },
  {
    id: 'band-row',
    name: 'Resistance band row',
    primary: 'rug',
    secondary: ['biceps', 'schouders'],
    equipment: 'Elastiek',
    sets: '3-4',
    reps: '10-15',
    rest: '75 sec',
    purpose: 'Thuisalternatief voor rows dat rugspieren en houding versterkt.',
    alternative: 'Geen elastiek? Doe towel rows aan een stevige deur alleen als dat veilig kan.',
    technique: {
      start: 'Bevestig de band op borsthoogte of zit met de band om je voeten.',
      posture: 'Rug lang, borst open, schouders laag en core licht aangespannen.',
      steps: [
        'Start met gestrekte armen en lichte spanning op de band.',
        'Trek ellebogen naar achteren langs je ribben.',
        'Knijp je schouderbladen kort samen.',
        'Laat rustig terug tot je armen strekken.',
      ],
      range: 'Van volledige armstrekking tot handen naast je romp.',
      breathing: 'Adem uit tijdens trekken, adem in tijdens teruggaan.',
      mistakes: ['Schouders optrekken', 'Band laten terugschieten', 'Polsen naar binnen knikken'],
      targetTips: ['Denk aan ellebogen naar je achterzakken', 'Houd de squeeze een seconde vast'],
      injuryTips: ['Controleer of de band stevig vastzit', 'Gebruik geen versleten elastiek'],
    },
  },
  {
    id: 'goblet-squat',
    name: 'Goblet squat',
    primary: 'quadriceps',
    secondary: ['billen', 'core', 'hamstrings'],
    equipment: 'Dumbbell of rugzak',
    sets: '3-4',
    reps: '10-15',
    rest: '90 sec',
    purpose: 'Traint benen met goede squatmechaniek en rompspanning.',
    alternative: 'Geen gewicht? Doe tempo bodyweight squats met 3 seconden zakken.',
    technique: {
      start: 'Houd gewicht tegen je borst, voeten ongeveer schouderbreed.',
      posture: 'Borst hoog, rug neutraal, knieën volgen de richting van de tenen.',
      steps: [
        'Adem in en span je buik alsof je een lichte klap opvangt.',
        'Zak door heupen en knieën tegelijk te buigen.',
        'Houd je hele voet op de vloer.',
        'Duw via middenvoet omhoog en span billen bovenin licht aan.',
      ],
      range: 'Zak zo diep als je kunt zonder hakken te liften of rug te bollen.',
      breathing: 'Adem in omlaag, adem uit omhoog.',
      mistakes: ['Knieën naar binnen', 'Hakken los', 'Romp laten instorten'],
      targetTips: ['Duw knieën subtiel naar buiten', 'Houd gewicht dicht tegen je lichaam'],
      injuryTips: ['Gebruik een stoel als diepte-check', 'Verlaag diepte bij knieklachten'],
    },
  },
  {
    id: 'reverse-lunge',
    name: 'Reverse lunge',
    primary: 'benen',
    secondary: ['billen', 'quadriceps', 'hamstrings', 'core'],
    equipment: 'Lichaamsgewicht of dumbbells',
    sets: '3',
    reps: '8-12 per been',
    rest: '75 sec',
    purpose: 'Verbetert enkelbenige kracht, balans en heupstabiliteit.',
    alternative: 'Balans lastig? Doe split squats met hand aan muur.',
    technique: {
      start: 'Sta rechtop met voeten heupbreed en eventueel dumbbells naast je.',
      posture: 'Romp lang, core actief, voorste knie boven middenvoet.',
      steps: [
        'Stap gecontroleerd achteruit.',
        'Zak totdat beide knieën ongeveer 90 graden buigen.',
        'Duw via de hak en middenvoet van je voorste been terug.',
        'Wissel benen of maak eerst alle reps aan een kant af.',
      ],
      range: 'Achterste knie richting vloer zonder hard contact.',
      breathing: 'Adem in tijdens zakken, adem uit tijdens terugduwen.',
      mistakes: ['Voorste knie naar binnen', 'Te korte stap', 'Afzetten met achterste been'],
      targetTips: ['Leun heel licht voorover voor meer bilfocus', 'Houd druk op je voorste voet'],
      injuryTips: ['Gebruik kleinere passen bij heupklachten', 'Beweeg langzaam genoeg om balans te houden'],
    },
  },
  {
    id: 'glute-bridge',
    name: 'Glute bridge',
    primary: 'billen',
    secondary: ['hamstrings', 'core'],
    equipment: 'Lichaamsgewicht of dumbbell',
    sets: '3-4',
    reps: '12-20',
    rest: '60 sec',
    purpose: 'Leert bilspieren actief te gebruiken zonder veel belasting op de rug.',
    alternative: 'Te makkelijk? Doe single-leg glute bridges.',
    technique: {
      start: 'Lig op je rug met knieën gebogen en voeten plat op heupbreedte.',
      posture: 'Ribben laag, bekken licht achterover kantelen, kin ontspannen.',
      steps: [
        'Duw via je hielen in de vloer.',
        'Breng heupen omhoog tot je romp en bovenbenen een lijn vormen.',
        'Knijp billen bovenin twee tellen aan.',
        'Laat rustig zakken zonder spanning volledig los te laten.',
      ],
      range: 'Volledig omhoog zonder onderrug hol te trekken.',
      breathing: 'Adem uit bij omhoogkomen, adem in bij zakken.',
      mistakes: ['Duwen via tenen', 'Onderug overstrekken', 'Voeten te ver weg plaatsen'],
      targetTips: ['Trek tenen licht op voor meer bilgevoel', 'Denk aan bekken naar ribben brengen'],
      injuryTips: ['Stop bij kramp in hamstrings en zet voeten dichterbij', 'Houd nek ontspannen'],
    },
  },
  {
    id: 'band-shoulder-press',
    name: 'Banded shoulder press',
    primary: 'schouders',
    secondary: ['triceps', 'core'],
    equipment: 'Elastiek',
    sets: '3',
    reps: '10-15',
    rest: '75 sec',
    purpose: 'Bouwt schouderuithoudingsvermogen en controle boven het hoofd.',
    alternative: 'Geen band? Doe pike push-ups of dumbbell shoulder press.',
    technique: {
      start: 'Sta op de band en houd de uiteinden op schouderhoogte.',
      posture: 'Core strak, ribben laag, ellebogen iets voor je romp.',
      steps: [
        'Duw handen omhoog tot boven je hoofd.',
        'Houd schouders laag en nek ontspannen.',
        'Laat gecontroleerd terug naar schouderhoogte.',
        'Blijf rechtop zonder naar achteren te leunen.',
      ],
      range: 'Van schouderhoogte tot armen bijna volledig gestrekt.',
      breathing: 'Adem uit tijdens drukken, adem in terug.',
      mistakes: ['Hol trekken in onderrug', 'Band scheef belasten', 'Elleboog te ver naar achter'],
      targetTips: ['Duw recht omhoog met stabiele polsen', 'Gebruik een band met constante controle'],
      injuryTips: ['Controleer de band onder je voeten', 'Vermijd pijnlijke schouderposities'],
    },
  },
  {
    id: 'band-biceps-curl',
    name: 'Banded biceps curl',
    primary: 'biceps',
    secondary: ['core'],
    equipment: 'Elastiek',
    sets: '3',
    reps: '12-20',
    rest: '60 sec',
    purpose: 'Thuisvriendelijke bicepsoefening met oplopende weerstand bovenin.',
    alternative: 'Geen band? Gebruik dumbbells, gevulde flessen of een rugzak.',
    technique: {
      start: 'Sta op het midden van de band en houd de uiteinden naast je lichaam.',
      posture: 'Sta lang, schouders laag, ellebogen tegen je zij en polsen recht.',
      steps: [
        'Curl je handen omhoog terwijl je ellebogen op dezelfde plek blijven.',
        'Houd bovenin een korte squeeze.',
        'Laat langzaam zakken tegen de spanning van de band in.',
        'Stop net voordat de band volledig slap wordt.',
      ],
      range: 'Van bijna gestrekte armen tot handen rond borsthoogte.',
      breathing: 'Adem uit omhoog, adem in omlaag.',
      mistakes: ['Naar achter leunen', 'Elleboog laten zweven', 'Band laten terugschieten'],
      targetTips: ['Maak de band korter voor meer spanning', 'Houd het tempo rustig bovenin'],
      injuryTips: ['Controleer de band op scheurtjes', 'Houd polsen neutraal om irritatie te vermijden'],
    },
  },
  {
    id: 'bench-dip',
    name: 'Bench dip',
    primary: 'triceps',
    secondary: ['schouders', 'borst'],
    equipment: 'Bank, stoel of lage verhoging',
    sets: '3',
    reps: '8-15',
    rest: '75 sec',
    purpose: 'Traint triceps met lichaamsgewicht en weinig materiaal.',
    alternative: 'Schouders gevoelig? Doe close-grip push-ups of band pressdowns.',
    technique: {
      start: 'Plaats handen op een stevige rand naast je heupen en voeten voor je.',
      posture: 'Borst open, schouders laag, ellebogen wijzen naar achteren.',
      steps: [
        'Schuif heupen net voor de rand.',
        'Zak recht omlaag door je ellebogen te buigen.',
        'Stop voordat schouders naar voren trekken.',
        'Duw jezelf omhoog door ellebogen te strekken.',
      ],
      range: 'Zak tot bovenarmen ongeveer parallel zijn of tot schouders comfortabel blijven.',
      breathing: 'Adem in tijdens zakken, adem uit tijdens omhoogduwen.',
      mistakes: ['Schouders naar oren trekken', 'Te diep zakken', 'Elleboog wijd naar buiten laten gaan'],
      targetTips: ['Houd heupen dicht bij de rand', 'Denk aan de rand omlaag duwen'],
      injuryTips: ['Kies close-grip push-ups bij schouderpijn', 'Gebruik een stabiele stoel die niet kan schuiven'],
    },
  },
  {
    id: 'dead-bug',
    name: 'Dead bug',
    primary: 'core',
    secondary: ['benen', 'schouders'],
    equipment: 'Lichaamsgewicht',
    sets: '3',
    reps: '8-12 per zijde',
    rest: '45 sec',
    purpose: 'Verbetert rompcontrole en leert neutrale rug houden onder beweging.',
    alternative: 'Te makkelijk? Houd lichte dumbbells vast of vertraag het tempo.',
    technique: {
      start: 'Lig op je rug met armen recht omhoog en knieën boven heupen.',
      posture: 'Druk onderrug zacht richting vloer, ribben laag, nek ontspannen.',
      steps: [
        'Span je buik aan zonder je adem vast te zetten.',
        'Strek langzaam tegenovergestelde arm en been uit.',
        'Stop voordat je onderrug loskomt van de vloer.',
        'Keer terug en wissel van zijde.',
      ],
      range: 'Alleen zo ver strekken als je onderrug stabiel blijft.',
      breathing: 'Adem uit tijdens uitstrekken, adem in bij terugkomen.',
      mistakes: ['Onderug laten bollen', 'Te snel bewegen', 'Schouders optrekken'],
      targetTips: ['Denk aan rits van broek naar ribben trekken', 'Beweeg traag en stil'],
      injuryTips: ['Maak de beweging kleiner bij rugklachten', 'Houd hoofd op de vloer'],
    },
  },
  {
    id: 'plank',
    name: 'Plank',
    primary: 'core',
    secondary: ['schouders', 'billen'],
    equipment: 'Lichaamsgewicht',
    sets: '3',
    reps: '30-60 sec',
    rest: '45 sec',
    purpose: 'Bouwt basisstabiliteit voor vrijwel alle krachtoefeningen.',
    alternative: 'Te zwaar? Doe plank vanaf knieën.',
    technique: {
      start: 'Plaats ellebogen onder schouders en voeten achter je.',
      posture: 'Maak een rechte lijn, span billen aan en trek ribben licht naar beneden.',
      steps: [
        'Duw ellebogen zacht in de vloer.',
        'Span buik en billen tegelijk aan.',
        'Houd nek neutraal met blik naar de vloer.',
        'Stop de set voordat je heupen doorzakken.',
      ],
      range: 'Statische positie zonder beweging in onderrug.',
      breathing: 'Blijf kort en rustig ademen achter je buikspanning.',
      mistakes: ['Heupen te hoog', 'Doorzakken in onderrug', 'Adem vasthouden'],
      targetTips: ['Denk aan ellebogen naar tenen trekken zonder te bewegen', 'Knijp billen actief aan'],
      injuryTips: ['Kies kortere sets met perfecte houding', 'Stop bij scherpe lage-rugpijn'],
    },
  },
]

const recipes: Recipe[] = [
  {
    name: 'Kip rijst bowl',
    description: 'Makkelijke herstelmaaltijd met veel eiwit en koolhydraten.',
    ingredients: ['160 g kipfilet', '125 g gekookte rijst', '200 g wokgroente', '1 el sojasaus'],
    portion: '1 grote bowl',
    protein: 42,
    calories: 560,
    labels: ['normaal', 'lactosevrij'],
  },
  {
    name: 'Skyr met banaan en noten',
    description: 'Snel ontbijt of snack met veel proteine.',
    ingredients: ['300 g skyr', '1 banaan', '20 g walnoten', '30 g havermout'],
    portion: '1 kom',
    protein: 35,
    calories: 480,
    labels: ['normaal', 'vegetarisch'],
  },
  {
    name: 'Tofu quinoa traybake',
    description: 'Vegetarische maaltijd met complete eiwitbron en vezels.',
    ingredients: ['180 g tofu', '120 g gekookte quinoa', '250 g groente', '1 el olijfolie'],
    portion: '1 bord',
    protein: 31,
    calories: 610,
    labels: ['vegetarisch', 'lactosevrij'],
  },
  {
    name: 'Tonijn aardappel salade',
    description: 'Lichte maaltijd voor vetverlies met veel verzadiging.',
    ingredients: ['1 blik tonijn', '250 g gekookte aardappel', 'Komkommer', 'Tomaat', '1 el yoghurtvrije dressing'],
    portion: '1 salade',
    protein: 36,
    calories: 430,
    labels: ['normaal', 'lactosevrij'],
  },
  {
    name: 'Eiwitrijke linzencurry',
    description: 'Comfortmaaltijd met plantaardige proteine en trage koolhydraten.',
    ingredients: ['200 g linzen', '150 ml kokosmelk light', 'Spinazie', 'Currykruiden', '100 g rijst'],
    portion: '1 diepe kom',
    protein: 28,
    calories: 590,
    labels: ['vegetarisch', 'lactosevrij'],
  },
  {
    name: 'Omelet met cottage cheese',
    description: 'Hartige maaltijd met veel leucine voor spierherstel.',
    ingredients: ['3 eieren', '150 g cottage cheese', 'Spinazie', 'Paprika', 'Volkoren toast'],
    portion: '1 omelet',
    protein: 39,
    calories: 520,
    labels: ['normaal', 'vegetarisch'],
  },
]

function App() {
  const [profile, setProfile] = useState<Profile>(() => loadProfile())
  const [selectedMuscle, setSelectedMuscle] = useState<Muscle | 'alles'>('alles')
  const [swaps, setSwaps] = useState<Record<string, number>>({})

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
  }, [profile])

  const plan = useMemo(() => buildPlan(profile, swaps), [profile, swaps])
  const proteinRange = useMemo(() => getProteinRange(profile.weight), [profile.weight])
  const matchingRecipes = useMemo(
    () => recipes.filter((recipe) => recipe.labels.includes(profile.diet)).slice(0, 4),
    [profile.diet],
  )
  const visiblePlan = useMemo(
    () =>
      plan.map((day) => ({
        ...day,
        exercises:
          selectedMuscle === 'alles'
            ? day.exercises
            : day.exercises.filter(
                (exercise) =>
                  exercise.primary === selectedMuscle || exercise.secondary.includes(selectedMuscle),
              ),
      })),
    [plan, selectedMuscle],
  )

  const activeMuscles = Array.from(new Set(plan.flatMap((day) => day.focus)))

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Persoonlijk fitnessdashboard</p>
          <h1>Train slimmer, herstel beter.</h1>
          <p className="intro">
            Een lokaal opgeslagen weekschema met techniekfocus, spiergroepvisuals, proteinedoel en
            simpele recepten voor jouw doel.
          </p>
        </div>
        <LocationToggle
          location={profile.location}
          onChange={(location) => setProfile((current) => ({ ...current, location }))}
        />
      </header>

      <section className="dashboard-grid">
        <ProfileForm profile={profile} onChange={setProfile} />
        <ProteinCard range={proteinRange} weight={profile.weight} goal={profile.goal} />
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Weekplanning</p>
            <h2>{profile.days} trainingsdagen per week</h2>
          </div>
          <MuscleFilter muscles={activeMuscles} value={selectedMuscle} onChange={setSelectedMuscle} />
        </div>
        <WeekOverview days={profile.days} />
        <div className="training-list">
          {visiblePlan.map((day, dayIndex) => (
            <TrainingDayCard
              day={day}
              dayIndex={dayIndex}
              key={day.title}
              location={profile.location}
              onSwap={(exercise) =>
                setSwaps((current) => ({
                  ...current,
                  [exercise.id]: (current[exercise.id] ?? 0) + 1,
                }))
              }
            />
          ))}
        </div>
      </section>

      <section className="section-block anatomy-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Anatomie</p>
            <h2>Spiervisuals</h2>
          </div>
          <p className="section-copy">
            Donker = primaire focus, licht = secundaire ondersteuning. Gebruik dit om bewuster te
            voelen welke spier de beweging moet sturen.
          </p>
        </div>
        <div className="anatomy-grid">
          {plan.slice(0, 4).map((day) => (
            <MuscleMap
              focus={day.focus}
              key={day.title}
              primary={day.exercises[0]?.primary ?? 'full body'}
              title={day.title}
            />
          ))}
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Voeding</p>
            <h2>Recepten voor {dietLabel(profile.diet)}</h2>
          </div>
          <p className="section-copy">
            Richt je maaltijden rond eiwit, groente en voldoende energie voor herstel.
          </p>
        </div>
        <div className="recipe-grid">
          {matchingRecipes.map((recipe) => (
            <RecipeCard key={recipe.name} recipe={recipe} />
          ))}
        </div>
      </section>

      <footer className="disclaimer">
        Dit dashboard geeft algemene fitnessinformatie en is geen medisch advies. Luister naar je
        lichaam en raadpleeg bij klachten, blessures of twijfel een arts, fysiotherapeut of
        gekwalificeerde trainer.
      </footer>
    </main>
  )
}

function loadProfile(): Profile {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return defaultProfile
    }

    const parsed = JSON.parse(stored) as Partial<Profile>
    return {
      weight: typeof parsed.weight === 'number' && parsed.weight > 0 ? parsed.weight : defaultProfile.weight,
      goal: isOneOf(parsed.goal, ['spiermassa', 'vetverlies', 'onderhoud'])
        ? parsed.goal
        : defaultProfile.goal,
      days: isOneOf(parsed.days, [3, 4, 5, 6]) ? parsed.days : defaultProfile.days,
      level: isOneOf(parsed.level, ['beginner', 'gemiddeld', 'gevorderd'])
        ? parsed.level
        : defaultProfile.level,
      diet: isOneOf(parsed.diet, ['normaal', 'vegetarisch', 'lactosevrij'])
        ? parsed.diet
        : defaultProfile.diet,
      location: isOneOf(parsed.location, ['gym', 'thuis']) ? parsed.location : defaultProfile.location,
    }
  } catch {
    return defaultProfile
  }
}

function isOneOf<T extends string | number>(value: unknown, options: readonly T[]): value is T {
  return options.includes(value as T)
}

function buildPlan(profile: Profile, swaps: Record<string, number>): TrainingDay[] {
  const library = profile.location === 'gym' ? gymExercises : homeExercises
  const selectedIds = new Set<string>()

  return dayTemplates[profile.days].map((template) => {
    const exercises = template.focus
      .flatMap((muscle) => pickExercise(library, muscle, selectedIds, swaps))
      .filter((exercise): exercise is Exercise => Boolean(exercise))
      .slice(0, profile.days >= 5 ? 5 : 4)

    return {
      title: template.title,
      focus: template.focus,
      exercises,
    }
  })
}

function pickExercise(
  library: Exercise[],
  muscle: Muscle,
  selectedIds: Set<string>,
  swaps: Record<string, number>,
) {
  const options = library.filter(
    (exercise) =>
      exercise.primary === muscle ||
      exercise.secondary.includes(muscle) ||
      (muscle === 'benen' &&
        ['quadriceps', 'hamstrings', 'billen', 'kuiten', 'benen'].includes(exercise.primary)),
  )

  const usable = options.length > 0 ? options : library
  const fresh = usable.filter((exercise) => !selectedIds.has(exercise.id))
  const pool = fresh.length > 0 ? fresh : usable
  const swapSeed = pool.reduce((sum, exercise) => sum + (swaps[exercise.id] ?? 0), 0)
  const picked = pool[swapSeed % pool.length]
  selectedIds.add(picked.id)

  return picked
}

function getProteinRange(weight: number) {
  const low = Math.round(weight * 1.6)
  const high = Math.round(weight * 2)
  return {
    low,
    high,
    perMeal: Math.round(((low + high) / 2) / 4),
  }
}

function LocationToggle({
  location,
  onChange,
}: {
  location: Location
  onChange: (location: Location) => void
}) {
  return (
    <div className="location-toggle" aria-label="Trainingslocatie">
      <button className={location === 'gym' ? 'active' : ''} onClick={() => onChange('gym')} type="button">
        Gym
      </button>
      <button className={location === 'thuis' ? 'active' : ''} onClick={() => onChange('thuis')} type="button">
        Thuis
      </button>
    </div>
  )
}

function ProfileForm({
  profile,
  onChange,
}: {
  profile: Profile
  onChange: (profile: Profile) => void
}) {
  return (
    <section className="panel profile-panel">
      <div className="panel-header">
        <p className="eyebrow">Intake</p>
        <h2>Jouw profiel</h2>
      </div>
      <div className="form-grid">
        <label>
          Lichaamsgewicht
          <div className="input-row">
            <input
              min="35"
              max="180"
              onChange={(event) =>
                onChange({ ...profile, weight: Number(event.target.value) || defaultProfile.weight })
              }
              type="number"
              value={profile.weight}
            />
            <span>kg</span>
          </div>
        </label>
        <SelectField
          label="Doel"
          onChange={(goal) => onChange({ ...profile, goal })}
          options={['spiermassa', 'vetverlies', 'onderhoud']}
          value={profile.goal}
        />
        <SelectField
          label="Trainingsdagen"
          onChange={(days) => onChange({ ...profile, days })}
          options={[3, 4, 5, 6]}
          value={profile.days}
        />
        <SelectField
          label="Niveau"
          onChange={(level) => onChange({ ...profile, level })}
          options={['beginner', 'gemiddeld', 'gevorderd']}
          value={profile.level}
        />
        <SelectField
          label="Dieetvoorkeur"
          onChange={(diet) => onChange({ ...profile, diet })}
          options={['normaal', 'vegetarisch', 'lactosevrij']}
          value={profile.diet}
        />
        <SelectField
          label="Trainingslocatie"
          onChange={(location) => onChange({ ...profile, location })}
          options={['gym', 'thuis']}
          value={profile.location}
        />
      </div>
    </section>
  )
}

function SelectField<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: readonly T[]
  onChange: (value: T) => void
}) {
  return (
    <label>
      {label}
      <select onChange={(event) => onChange(parseSelectValue(event.target.value, options))} value={value}>
        {options.map((option) => (
          <option key={option} value={option}>
            {String(option)}
          </option>
        ))}
      </select>
    </label>
  )
}

function parseSelectValue<T extends string | number>(value: string, options: readonly T[]) {
  const sample = options[0]
  const parsed = typeof sample === 'number' ? Number(value) : value
  return parsed as T
}

function ProteinCard({
  range,
  weight,
  goal,
}: {
  range: ReturnType<typeof getProteinRange>
  weight: number
  goal: Goal
}) {
  return (
    <section className="panel protein-panel">
      <div className="panel-header">
        <p className="eyebrow">Proteine</p>
        <h2>{range.low}-{range.high} g per dag</h2>
      </div>
      <p>
        Op basis van {weight} kg lichaamsgewicht en 1.6 tot 2.0 gram proteine per kg. Dit helpt bij
        spierherstel, behoud van spiermassa en verzadiging tijdens {goal}.
      </p>
      <div className="macro-strip">
        <span>4 maaltijden</span>
        <strong>{range.perMeal} g</strong>
        <span>per maaltijd</span>
      </div>
    </section>
  )
}

function MuscleFilter({
  muscles,
  value,
  onChange,
}: {
  muscles: Muscle[]
  value: Muscle | 'alles'
  onChange: (value: Muscle | 'alles') => void
}) {
  return (
    <div className="filter-bar">
      <button className={value === 'alles' ? 'active' : ''} onClick={() => onChange('alles')} type="button">
        Alles
      </button>
      {muscles.map((muscle) => (
        <button
          className={value === muscle ? 'active' : ''}
          key={muscle}
          onClick={() => onChange(muscle)}
          type="button"
        >
          {muscleLabels[muscle]}
        </button>
      ))}
    </div>
  )
}

function WeekOverview({ days }: { days: Profile['days'] }) {
  return (
    <div className="week-overview">
      {weeklyLabels.map((label, index) => {
        const trainingDay = index < days
        return (
          <div className={trainingDay ? 'week-day training' : 'week-day rest'} key={label}>
            <strong>{label}</strong>
            <span>{trainingDay ? `Training ${index + 1}` : 'Rust'}</span>
          </div>
        )
      })}
    </div>
  )
}

function TrainingDayCard({
  day,
  dayIndex,
  location,
  onSwap,
}: {
  day: TrainingDay
  dayIndex: number
  location: Location
  onSwap: (exercise: Exercise) => void
}) {
  return (
    <article className="training-card">
      <div className="training-header">
        <div>
          <p className="eyebrow">{location === 'gym' ? 'Gym-versie' : 'Thuis-versie'}</p>
          <h3>{day.title}</h3>
        </div>
        <div className="day-index">{dayIndex + 1}</div>
      </div>
      <div className="muscle-tags">
        {day.focus.map((muscle) => (
          <span key={muscle}>{muscleLabels[muscle]}</span>
        ))}
      </div>
      {day.exercises.length === 0 ? (
        <p className="empty-state">Geen oefeningen binnen dit filter. Kies een andere spiergroep.</p>
      ) : (
        <div className="exercise-stack">
          {day.exercises.map((exercise) => (
            <ExerciseCard exercise={exercise} key={exercise.id} onSwap={() => onSwap(exercise)} />
          ))}
        </div>
      )}
    </article>
  )
}

function ExerciseCard({ exercise, onSwap }: { exercise: Exercise; onSwap: () => void }) {
  return (
    <details className="exercise-card">
      <summary>
        <div className="exercise-summary">
          <MuscleMap
            compact
            focus={exercise.secondary}
            primary={exercise.primary}
            title={exercise.name}
          />
          <div>
            <h4>{exercise.name}</h4>
            <p>{exercise.purpose}</p>
            <div className="exercise-meta">
              <span>{exercise.sets} sets</span>
              <span>{exercise.reps} reps</span>
              <span>{exercise.rest} rust</span>
              <span>{exercise.equipment}</span>
            </div>
          </div>
        </div>
      </summary>
      <div className="exercise-detail">
        <div className="target-line">
          <strong>Primair: {muscleLabels[exercise.primary]}</strong>
          <span>Secundair: {exercise.secondary.map((muscle) => muscleLabels[muscle]).join(', ')}</span>
        </div>
        <TechniqueBlock exercise={exercise} />
        <div className="alternative-row">
          <span>{exercise.alternative}</span>
          <button onClick={onSwap} type="button">
            Andere oefening
          </button>
        </div>
      </div>
    </details>
  )
}

function TechniqueBlock({ exercise }: { exercise: Exercise }) {
  return (
    <div className="technique-grid">
      <InfoBlock title="Startpositie" value={exercise.technique.start} />
      <InfoBlock title="Houding" value={exercise.technique.posture} />
      <InfoBlock title="Range of motion" value={exercise.technique.range} />
      <InfoBlock title="Ademhaling" value={exercise.technique.breathing} />
      <ListBlock title="Stap voor stap" values={exercise.technique.steps} />
      <ListBlock title="Veelgemaakte fouten" values={exercise.technique.mistakes} />
      <ListBlock title="Spier beter targeten" values={exercise.technique.targetTips} />
      <ListBlock title="Blessures voorkomen" values={exercise.technique.injuryTips} />
    </div>
  )
}

function InfoBlock({ title, value }: { title: string; value: string }) {
  return (
    <div className="info-block">
      <strong>{title}</strong>
      <p>{value}</p>
    </div>
  )
}

function ListBlock({ title, values }: { title: string; values: string[] }) {
  return (
    <div className="info-block">
      <strong>{title}</strong>
      <ul>
        {values.map((value) => (
          <li key={value}>{value}</li>
        ))}
      </ul>
    </div>
  )
}

function MuscleMap({
  primary,
  focus,
  title,
  compact = false,
}: {
  primary: Muscle
  focus: Muscle[]
  title: string
  compact?: boolean
}) {
  const highlighted = new Set<Muscle>([primary, ...focus])

  return (
    <div className={compact ? 'muscle-map compact' : 'muscle-map'} aria-label={`Spiervisual voor ${title}`}>
      {!compact && <strong>{title}</strong>}
      <svg viewBox="0 0 120 220" role="img">
        <title>{title}</title>
        <circle className="body-base" cx="60" cy="22" r="14" />
        <rect className={partClass('schouders', primary, highlighted)} x="30" y="42" width="60" height="18" rx="9" />
        <rect className={partClass('borst', primary, highlighted)} x="39" y="58" width="42" height="28" rx="10" />
        <rect className={partClass('rug', primary, highlighted)} x="42" y="88" width="36" height="38" rx="12" />
        <rect className={partClass('core', primary, highlighted)} x="44" y="112" width="32" height="36" rx="9" />
        <rect className={partClass('biceps', primary, highlighted)} x="18" y="62" width="14" height="42" rx="7" />
        <rect className={partClass('triceps', primary, highlighted)} x="88" y="62" width="14" height="42" rx="7" />
        <rect className={partClass('billen', primary, highlighted)} x="41" y="145" width="38" height="22" rx="9" />
        <rect className={partClass('quadriceps', primary, highlighted)} x="36" y="166" width="18" height="38" rx="8" />
        <rect className={partClass('hamstrings', primary, highlighted)} x="66" y="166" width="18" height="38" rx="8" />
        <rect className={partClass('kuiten', primary, highlighted)} x="38" y="202" width="16" height="16" rx="7" />
        <rect className={partClass('kuiten', primary, highlighted)} x="66" y="202" width="16" height="16" rx="7" />
      </svg>
      {!compact && (
        <div className="map-legend">
          <span className="primary-dot"></span> primair
          <span className="secondary-dot"></span> secundair
        </div>
      )}
    </div>
  )
}

function partClass(muscle: Muscle, primary: Muscle, highlighted: Set<Muscle>) {
  if (muscle === primary) {
    return 'body-part primary'
  }

  if (highlighted.has(muscle) || primary === 'benen') {
    return 'body-part secondary'
  }

  return 'body-part'
}

function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <article className="recipe-card">
      <div>
        <p className="eyebrow">{recipe.labels.map(dietLabel).join(' / ')}</p>
        <h3>{recipe.name}</h3>
        <p>{recipe.description}</p>
      </div>
      <div className="recipe-metrics">
        <span>{recipe.protein} g proteine</span>
        <span>{recipe.calories} kcal</span>
        <span>{recipe.portion}</span>
      </div>
      <ul>
        {recipe.ingredients.map((ingredient) => (
          <li key={ingredient}>{ingredient}</li>
        ))}
      </ul>
    </article>
  )
}

function dietLabel(diet: Diet) {
  const labels: Record<Diet, string> = {
    normaal: 'normaal',
    vegetarisch: 'vegetarisch',
    lactosevrij: 'lactosevrij',
  }

  return labels[diet]
}

export default App
