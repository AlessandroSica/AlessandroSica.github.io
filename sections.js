// Section pages: clicking a planet opens its surface. Content comes from the CV;
// each planet has a population of pixel creatures that walk on top of the
// panels, hop between them and shout out the facts written in the panel they
// stand on (the matching words light up while they talk).

(() => {
  const { makeSprite, PlanetSprite, ICONS, LOGOS, SECTIONS } = window.Planets;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const LINKS = {
    linkedin: 'https://www.linkedin.com/in/-alessandro-sica',
    email: 'mailto:alessandrosica500@gmail.com',
    github: 'https://github.com/AlessandroSica',
  };

  // organisation logos, cropped and cleaned from images/ into assets/logos/.
  // framed: logos that sit on their own tile rather than as a free shape
  const ORG_LOGOS = {
    'ETH logo': { src: 'eth', framed: true },
    'UoM logo': { src: 'uom', framed: true },
    'RoboSoc logo': { src: 'robosoc' },
    'PASS logo': { src: 'pass' },
    'EEESoc logo': { src: 'eeesoc' },
    'Maximum Robotics logo': { src: 'maxrobotics', framed: true },
    'Bonfiglioli logo': { src: 'bonfiglioli', framed: true },
    'Cubbit logo': { src: 'cubbit', framed: true },
  };

  // ---------- extra props ----------

  const medal = (y, o) => makeSprite([{ x: 0, y: 0, rows: [
    '.rr...bb.',
    '..rr.bb..',
    '...rbb...',
    '...yyy...',
    '..yyyyy..',
    '.yywyyyy.',
    '.ywyyyyo.',
    '.yyyyyoo.',
    '..yyooo..',
    '...ooo...',
  ] }], { r: '#ff3b6b', b: '#3b7bff', y, o, w: '#ffffff' });

  const PROPS = {
    book: makeSprite([{ x: 0, y: 0, rows: [
      'rrrrrrrrrr.',
      'rwwwwwwwwrr',
      'rwkkkkkwwrr',
      'rwwwwwwwwrr',
      'rwkkkkwwwrr',
      'rwwwwwwwwrr',
      'rrrrrrrrrrr',
      '.rrrrrrrrrr',
    ] }], { r: '#c4301c', w: '#fff6dc', k: '#a8875a' }),
    gear: makeSprite([{ x: 0, y: 0, rows: [
      '....ggg....',
      '.gg.ggg.gg.',
      '.ggggggggg.',
      '..ggg.ggg..',
      'gggg...gggg',
      'gggg...gggg',
      'gggg...gggg',
      '..ggg.ggg..',
      '.ggggggggg.',
      '.gg.ggg.gg.',
      '....ggg....',
    ] }], { g: '#8a90a0' }),
    medalGold: medal('#ffd23f', '#e09a1a'),
    medalSilver: medal('#e6e9f0', '#9aa3b5'),
    medalBronze: medal('#e0904a', '#a0582a'),
  };

  const sprite = name => ICONS[name] || LOGOS[name] || PROPS[name];

  // ---------- creatures ----------
  // body rows + two leg frames; palettes can be swapped for variants

  const CREATURES = {
    owl: {
      body: ['.kkkkkkkk.', '...kkkk.y.', '..bbbbbb.y', '.bwwbbwwb.', '.bwkbbwkb.', '.bbboobbb.', '.bbccccbb.', '.bbccccbb.', '..bbbbbb..'],
      a: ['..o....o..'], b: ['...o..o...'],
      colors: { k: '#3a2f5a', y: '#ffcc33', b: '#a8784a', w: '#ffffff', o: '#ff9a3d', c: '#e8c89a' },
      variants: [{}, { b: '#9aa3b5', c: '#e6e9f0' }],
    },
    bot: {
      body: ['....c....', '....g....', '.ggggggg.', '.gkkkkkg.', '.gkckckg.', '.gkkkkkg.', '.ggggggg.', '..ddddd..'],
      a: ['..d...d..', '.tt...tt.'], b: ['..d...d..', '..tt.tt..'],
      colors: { g: '#c9d3e0', k: '#1d2740', c: '#4ff0ff', d: '#8a90a0', t: '#4a5060' },
      variants: [{}, { g: '#ffcc33', c: '#ff4fe1' }, { g: '#7dff9a' }],
    },
    martian: {
      body: ['.a......a.', '..a....a..', '..gggggg..', '.gwwggwwg.', '.gwkggwkg.', '.gggggggg.', '.ggg..ggg.', '..gggggg..'],
      a: ['.gg....gg.'], b: ['..gg..gg..'],
      colors: { g: '#7dff6a', w: '#ffffff', k: '#1a1030', a: '#ffcc33' },
      variants: [{}, { g: '#4ff0ff' }],
    },
    brainling: {
      body: ['...pppp...', '..pPpPpp..', '.pPppPpPp.', '.pppPpppp.', '.cwcppcwc.', '.pppppppp.', '..pppppp..'],
      a: ['..p.pp.p..', '.p..p..p..'], b: ['..p.pp.p..', '..p..p..p.'],
      colors: { p: '#ff8fd0', P: '#c2378f', c: '#4ff0ff', w: '#ffffff' },
      variants: [{}, { p: '#b78bff', P: '#7a4fd0' }],
    },
    earthling: {
      body: ['...bbbb...', '..bbbbbb..', '.bbwwwwbb.', '.bbwkkwbb.', '.bbwwwwbb.', '.bbbbbbbb.', '.bbbkkbbb.', '..bbbbbb..'],
      a: ['..b....b..'], b: ['...b..b...'],
      colors: { b: '#7dff9a', w: '#ffffff', k: '#1a1030' },
      variants: [{}, { b: '#5cc0f0' }, { b: '#ffcc33' }],
    },
    penguin: {
      body: ['...kkkk...', '..kkkkkk..', '..kwkkwk..', '..kwwwwk..', '.kkwyywkk.', 'k.kwwwwk.k', '..kwwwwk..', '..kwwwwk..'],
      a: ['...y..y...'], b: ['..y....y..'],
      colors: { k: '#2456b0', w: '#d8f4ff', y: '#ffd23f' },
      variants: [{}, { k: '#3f8ee0' }],
    },
    builder: {
      body: ['...yyyy...', '..yywyyy..', '.oooooooo.', '..gggggg..', '..gcggcg..', '..gggggg..', '.dggggggd.', '.d.gggg.d.'],
      a: ['...g..g...', '..tt..tt..'], b: ['...g..g...', '...tt.tt..'],
      colors: { y: '#ffcc33', w: '#fff3b0', o: '#e08a1a', g: '#c9d3e0', c: '#4ff0ff', d: '#8a90a0', t: '#4a5060' },
      variants: [{}, { g: '#6fa8ff' }],
    },
  };

  const creatureFrames = {};
  function framesFor(kind, variant) {
    const key = kind + variant;
    if (!creatureFrames[key]) {
      const c = CREATURES[kind];
      const colors = { ...c.colors, ...c.variants[variant] };
      creatureFrames[key] = [c.a, c.b].map(legs =>
        makeSprite([{ x: 0, y: 0, rows: [...c.body, ...legs] }], colors));
    }
    return creatureFrames[key];
  }

  // ---------- content (from the CV) ----------
  // {{shown text|what a creature shouts about it}} marks a fact creatures react to

  const DATA = {
    education: {
      population: { kind: 'owl', name: 'scholar owls', count: 1204 },
      floaters: ['temple', 'book', 'book', 'medalGold'],
      quips: ['Hoo! Study time', 'Control Systems!', 'Mechatronics!', 'Grüezi, ETH!', 'MPC time!'],
      blocks: [
        {
          type: 'card', wide: true,
          logo: 'ETH logo',
          title: 'ETH Zürich',
          sub: 'MSc Robotics, Systems and Control',
          date: 'Sep 2026 – Present', place: 'Zürich, Switzerland',
          bullets: [
            'Currently pursuing the {{MSc in Robotics, Systems and Control|Master at ETH!}}.',
            'Courses this semester:',
          ],
          tags: ['Real World Robotics', 'Advanced Machine Learning', 'Model Predictive Control', 'Robot Dynamics'],
        },
        {
          type: 'card', wide: true,
          logo: 'UoM logo',
          title: 'The University of Manchester',
          sub: 'BEng Mechatronic Engineering',
          date: 'Sep 2023 – Jul 2026', place: 'Manchester, UK',
          bullets: [
            '{{Final Bachelor Score: 81/100|81 out of 100!}}, {{First Class Honours|First Class Honours!}}.',
            '3rd Year Average: 80/100, First Class Honours, {{top 4% of the cohort|Top 4% again!}}.',
            '2nd Year Average: 84/100, First Class Honours, {{top 5% of the cohort|Top 5%!}}.',
            '1st Year Average: {{92/100|92 in year one?!}}, First Class Honours, {{top 2% of the cohort|Top 2%!}}.',
          ],
        },
        {
          type: 'chart', title: 'Yearly average',
          bars: [['Year 1', 92, 'Top 4%'], ['Year 2', 84, 'Top 5%'], ['Year 3', 80, 'Top 4%'], ['Final', 81, 'First Class']],
        },
        {
          type: 'tags', title: 'Relevant courses',
          tags: ['Control Systems I', 'Control Systems II', 'Applied Mechanics & Industrial Robotics',
            'Mechatronics Analysis & Design', 'Mobile Robots & Autonomous Systems'],
          quips: ['I aced Control II', 'Mobile Robots!', 'Industrial Robotics!'],
        },
      ],
    },

    skills: {
      population: { kind: 'bot', name: 'bit-bots', count: 1024 },
      floaters: ['Python', 'C++', 'MATLAB', 'ROS 2', 'OpenCV', 'Blender', 'Git', 'GitHub', 'Linux', 'VS Code', 'Claude Code'],
      quips: ['import cv2', 'ros2 launch', '#include <iostream>', 'sudo apt update', 'git push', 'beep boop'],
      blocks: [
        { type: 'skills', title: 'Programming', items: ['Python', 'C++', 'MATLAB'], quips: ['import numpy as np', 'std::cout << "hi"', 'MATLAB matrices!'] },
        { type: 'skills', title: 'Robotics & Simulation', items: ['ROS 2', 'PyBullet', 'Simulink'], quips: ['ros2 topic echo', 'p.stepSimulation()', 'Simulink blocks!'] },
        { type: 'skills', title: 'Computer Vision', items: ['OpenCV', 'YOLO'], quips: ['cv2.imshow()', 'YOLO: you only look once', 'I see a pallet'] },
        { type: 'skills', title: 'CAD & 3D Modelling', items: ['Fusion 360', 'Blender'], quips: ['Extrude!', 'Rendering...'] },
        { type: 'skills', title: 'Tools & Operating Systems', items: ['Git', 'GitHub', 'Linux', 'VS Code', 'Claude Code'], wide: true, quips: ['git commit -m "fix"', 'sudo make me a sandwich', 'Claude, write tests'] },
      ],
    },

    projects: {
      population: { kind: 'martian', name: 'martians', count: 48 },
      floaters: ['rover', 'gear', 'robotArm', 'gear'],
      quips: ['Take me to your PCB', 'Ship it!', 'Beep beep'],
      blocks: [
        {
          type: 'card', wide: true,
          title: 'Robot Bartender',
          sub: 'Hacklab weekend hackathon, team of 4',
          date: 'Sep 2026', place: 'Hacklab',
          media: { video: 'robot-bartender.mp4', poster: 'robot-bartender.jpg', small: true, alt: 'A UR5 arm mixing a drink ordered through Spectacles smart glasses' },
          bullets: [
            'Built an {{automated bartender|One drink, coming up!}} over a weekend: order through {{Snap Spectacles|Order with your glasses!}}, ElevenLabs voice, VLM reasoning and an intent classifier, then a {{Universal Robots UR5|The UR5 pours!}} makes the drink.',
            'My part: {{VLM setup|Qwen sees the bar}}, data selection, the {{labeling pipeline|Label all the bottles!}}, and {{fine-tuning Qwen models|Fine-tuned on NVIDIA!}} on NVIDIA GPUs.',
          ],
          tags: ['Python', 'Qwen3-VL', 'ROS 2', 'UR5', 'Spectacles'],
          links: [{ label: 'GitHub', href: 'https://github.com/UR5-AlienBazaar/vlm' }],
        },
        {
          type: 'card',
          title: 'Weight-Sensing Pick-and-Place Robot',
          sub: 'Intel Industrial Robotics Arm Challenge, EUROPE EMBODIED Hackathon',
          date: 'Jun 2026', place: 'Munich, Germany',
          media: { src: 'pick-and-place.jpg', alt: 'Pipeline of the Franka Panda sorter: global and wrist camera vision, picking, weight estimation from torque sensors, and placing' },
          bullets: [
            'Built with a team of 3 {{in 48 hours|48 hours, no sleep!}}: added weight-estimation-based sorting to a {{Franka Emika Panda|A Franka Panda!}} pick-and-place routine using its own {{joint torque sensors|It weighs with its joints!}} and a custom neural network.',
            'Combined 2D and depth wrist-camera perception for pick refinement with an API-based {{VLM|A VLM sorts on request}} for user-specified sorting, running the {{OpenCV/YOLO|YOLO spotted it!}} pipeline via {{Intel OpenVINO|Low-latency OpenVINO!}} for low-latency inference.',
          ],
          tags: ['Python', 'OpenCV', 'YOLO', 'OpenVINO', 'Franka Panda'],
          links: [{ label: 'GitHub', href: null }, { label: 'Demo video', href: 'https://canva.link/hmmscc2khgo3771' }, { label: 'Pitch', href: 'https://canva.link/9svvkagh3xanrok' }],
        },
        {
          type: 'card',
          title: 'Embedded Systems Project',
          sub: 'BEng Mechatronic Engineering, The University of Manchester',
          date: 'Sep 2024 – May 2025', place: 'Manchester, UK',
          media: { video: 'buggy-race.mp4', poster: 'buggy-race.jpg', loop: true, alt: 'The line-following buggy racing around the track' },
          bullets: [
            'Developed a {{line-following buggy|Follow that line!}} with custom chassis, {{PCB design|We made a PCB!}} and an infrared sensor array, programmed in C++ on an {{STM32|STM32 go brrr}} microcontroller with {{PID control|PID tuned!}} for steering and speed regulation.',
            'Individual Score: {{95/100|95 out of 100!}}, {{highest overall for the 2024/2025 cohort|Highest in the cohort!}}.',
          ],
          tags: ['C++', 'STM32', 'PCB design', 'PID control'],
          links: [{ label: 'GitHub', href: null }],
        },
      ],
    },

    research: {
      population: { kind: 'brainling', name: 'brainlings', count: 1800 },
      floaters: ['robotArm', 'chip', 'gear'],
      quips: ['Hypothesis!', 'Peer review pending', 'Fascinating...'],
      blocks: [
        {
          type: 'card', wide: true,
          logo: 'UoM logo',
          title: 'Bachelor Dissertation',
          sub: 'A Contact-Aware Navigation Framework with Online Traversability Reasoning in Unknown Cluttered Environments',
          date: 'Sep 2025 – Present', place: 'The University of Manchester',
          bullets: [
            'Dissertation Grade: {{86/100|Graded 86!}}.',
            'A contact-aware 2D navigation framework that lets robots navigate unknown, cluttered environments by {{safely interacting with compliant obstacles|Push through the soft stuff!}} to reach a goal.',
            'LiDAR-based incremental {{occupancy-grid mapping|Mapping...}} and {{frontier-based exploration|New frontier!}} with online {{A* path planning|A* found a path!}}, a custom cost function for dynamic target selection, and a contact-aware decision layer that exploits inferred traversability.',
            'Validated in PyBullet across {{1,800 paired trials|1,800 trials!}}: {{shorter paths in all nine conditions|Shorter every time!}} and {{up to 11.5 percentage points|+11.5 pp success!}} higher success rate, with ongoing validation on a {{PiPER manipulator|PiPER arm on duty}} with LiDAR and force sensing.',
            'Aiming to submit the work to {{IROS 2027|Next stop: IROS!}}.',
          ],
          links: [
            { label: 'Thesis', href: 'https://drive.google.com/file/d/1H5fEEHGqkO6gmYOJ12yE6cuEjVTnWrGk/view?usp=sharing' },
            { label: 'Video', href: 'https://canva.link/aejz8yloep58nog' },
            { label: 'Presentation', href: 'https://canva.link/47wnarj7axk53fi' },
            { label: 'Paper (coming soon)', href: null },
            { label: 'GitHub', href: null },
          ],
        },
        { type: 'sim', title: 'Live demo: contact-aware navigation' },
        {
          type: 'card', wide: true,
          logo: 'UoM logo',
          title: 'Summer Research Internship',
          sub: 'Vision and Language-guided Real-time Emotional Text Generation for Human-Robot Interaction',
          date: 'Jun 2025 – Aug 2025', place: 'School of Engineering, The University of Manchester',
          bullets: [
            'A real-time {{multimodal emotion recognition|I detect: HAPPY 92%}} model that lets robots understand human affect from {{facial expressions and speech|Smile detected!}}.',
            'Deep learning for vision and audio: a {{modified ResNet18|ResNet18 online}} with custom preprocessing and augmentation for faces, and {{transfer learning|Transfer learning!}} on pretrained speech models with a custom classification head.',
            'Built towards emotionally adaptive chatbot responses, with planned integration on humanoid robots such as {{Pepper|Hi Pepper!}}.',
          ],
          links: [{ label: 'GitHub', href: 'https://github.com/AlessandroSica/HRI-Internship-Project-25' }],
        },
      ],
    },

    positions: {
      population: { kind: 'earthling', name: 'earthlings', count: 600 },
      floaters: ['microphone', 'book', 'robotArm'],
      quips: ['Meeting at 6!', 'Who brought snacks?', 'Join the society!'],
      blocks: [
        {
          type: 'card', wide: true,
          logo: 'RoboSoc logo',
          title: 'President of the Robotics Society',
          sub: 'The University of Manchester',
          date: 'Jun 2025 – Jun 2026', place: 'Manchester, UK',
          bullets: [
            'Leading {{UoM’s largest society|Biggest society!}}, managing a {{20-person committee|20 on the committee!}}, scaling membership to {{600|600 members!}} and making it one of the UK’s largest societies, while overseeing {{eight robotics projects|8 projects!}}.',
            'Coordinating {{Hackabot|Hackabot!!}}, the UK’s largest robotics hackathon, with {{350+ participants|350+ hackers!}} and a value exceeding {{£30 000|£30k event!}}.',
          ],
          links: [{ label: 'Robotics Society', href: 'https://www.uom-robosoc.com/' }, { label: 'Hackabot', href: 'https://hackabot-2026.com/' }],
        },
        {
          type: 'card', logo: 'PASS logo',
          title: 'PASS Coordinator, Mechatronic Engineering',
          sub: 'The University of Manchester', date: 'Sep 2025 – Jun 2026', place: 'Manchester, UK',
          bullets: ['Overseeing {{46 PASS Leaders|46 leaders!}}, managing funds and coordinating briefing sessions and academic support.'],
        },
        {
          type: 'card', logo: 'RoboSoc logo',
          title: 'Buggy Project Leader, Robotics Society',
          sub: 'The University of Manchester', date: 'Sep 2024 – Jun 2025', place: 'Manchester, UK',
          bullets: [
            'Oversaw {{130+ members|130 builders!}} building Arduino robots for {{autonomous maze navigation|Left, left, right!}}.',
            'Weekly workshops, competitions, and {{100+ pages of guides|100 pages of guides!}}.',
          ],
        },
        {
          type: 'card', logo: 'EEESoc logo',
          title: 'Events Coordinator, EEE Society',
          sub: 'The University of Manchester', date: 'Sep 2024 – Jun 2025', place: 'Manchester, UK',
          bullets: ['Ran events with {{guest speakers from academia and industry|Guest speaker time!}}, coordinating with professionals and PhD researchers.'],
        },
        {
          type: 'card', logo: 'PASS logo',
          title: 'PASS Leader, Mechatronic Engineering',
          sub: 'The University of Manchester', date: 'Sep 2024 – Jun 2025', place: 'Manchester, UK',
          bullets: ['Weekly {{Peer Assisted Study Sessions|Study session!}} for first-year students.'],
        },
      ],
    },

    awards: {
      population: { kind: 'penguin', name: 'ice penguins', count: 350 },
      floaters: ['trophy', 'medalGold', 'medalSilver', 'medalBronze'],
      quips: ['Congrats!!', '*flaps proudly*', 'Shiny!'],
      blocks: [
        {
          type: 'card', wide: true, medal: 'medalGold',
          title: 'EUROPE EMBODIED Hackathon – 1st Place Overall',
          sub: 'ESRA, RoboTUM, START Munich & TUM International', date: 'Jun 2026', place: 'Munich, Germany',
          bullets: ['Won the {{Intel Industrial Robotics Arm Challenge|Track winners!}} and {{1st place overall|FIRST PLACE!}} with team RoBoost (3 members), out of {{350+ applicants|Beat 350+!}}, earning {{€2000 in cash|€2000!}} and €5000 in Claude credits.'],
          links: [{ label: 'Announcement', href: 'https://www.linkedin.com/posts/europe-embodied_hmi2market-eiturbanmobility-eithei-activity-7477254590359310336-mbpZ' }],
        },
        {
          type: 'card', medal: 'medalGold',
          title: 'Outstanding Contribution to Developing Student Community Prize',
          sub: 'The University of Manchester, School of Engineering', date: 'Jul 2026', place: 'Manchester, UK',
          bullets: ['Awarded to {{a single student|Only one winner!}} across the School of Engineering for 2025/26.'],
        },
        {
          type: 'card', medal: 'medalGold',
          title: 'PASS Scheme Award Winner',
          sub: 'The University of Manchester', date: 'Jun 2026', place: 'Manchester, UK',
          bullets: ['Selected as the {{best PASS scheme across all courses|Best scheme!}}, as PASS Coordinator in a team of 5.'],
        },
        {
          type: 'card', medal: 'medalSilver',
          title: 'Committee Member of the Year',
          sub: 'University of Manchester Students’ Union', date: 'Jun 2025', place: 'Manchester, UK',
          bullets: ['{{Highly commended|Highly commended!}} as Buggy Leader among committees from {{683 student societies|Out of 683!}}.'],
        },
        {
          type: 'card', medal: 'medalBronze',
          title: 'Embedded Systems Project Race',
          sub: 'BEng Mechatronic Engineering, The University of Manchester', date: 'May 2025', place: 'Manchester, UK',
          bullets: ['Placed {{3rd out of 50+ teams|3rd place podium!}} in the line-following race.'],
        },
      ],
    },

    work: {
      population: { kind: 'builder', name: 'builder bots', count: 3 },
      floaters: ['work', 'gear', 'gear', 'robotArm'],
      quips: ['Safety first!', 'Clocking in', 'Hard hats on!'],
      blocks: [
        {
          type: 'card', wide: true, logo: 'Maximum Robotics logo',
          title: 'Robotics Intern – Maximum Robotics',
          sub: 'Startup founded by the CEO of Woodruff Engineering', date: 'Sep 2025 – Jun 2026', place: 'Remote',
          bullets: [
            'Simulating {{two coordinated 6-DOF robotic manipulators|Two arms, one rail!}} on rails for automated exchange of plasma guns in a {{digital twin|Digital twin!}} of a {{Plasma-Jet-Driven Magneto-Inertial Fusion|FUSION?!}} (PJMIF) chamber.',
            'Focusing on {{motion coordination|Coordinating...}}, task exchange and {{safe planning|No collisions!}} for arms sharing a workspace.',
          ],
          media: { src: 'maxrobotics-sim.jpg', small: true, alt: 'Simulation of a 6-DOF robotic arm on a rail beside a PJMIF fusion chamber covered in plasma guns' },
        },
        {
          type: 'card', logo: 'Bonfiglioli logo',
          title: 'Robotics Intern – Bonfiglioli Riduttori S.p.A.',
          sub: 'Gearbox & drive systems manufacturer', date: 'Jun 2024 – Aug 2024', place: 'Bologna, Italy',
          bullets: [
            'Worked with a {{Laser Guided Vehicle|LGV coming through!}} for {{autonomous pallet transport|Pallet delivered!}}, troubleshooting issues and optimising its integration in the factory workflow.',
            'Analysed proposed transport paths and contributed to technical reports.',
          ],
          media: { src: 'bonfiglioli-lgv.jpg', alt: 'Toyota laser guided vehicle (autonomous pallet truck) with its navigation laser mast', fit: true },
        },
        {
          type: 'card', logo: 'Cubbit logo',
          title: 'Software Intern – Cubbit',
          sub: 'Cloud storage startup', date: 'Jun 2022 – Aug 2022', place: 'Bologna, Italy',
          bullets: [
            'Built a {{Python chatbot for Slack|Lunch bot online!}} running continuously on a {{Raspberry Pi|Raspberry Pi!}} via ngrok, automating {{lunch scheduling|Lunch at 1?}} and personalised food suggestions through chat commands.',
          ],
          links: [{ label: 'GitHub', href: 'https://github.com/AlessandroSica/Lunch_Organizer_Bot' }],
        },
      ],
    },
  };

  // ---------- DOM helpers ----------

  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const rich = s => esc(s).replace(/\{\{(.+?)\|(.+?)\}\}/g, (_, text, quip) => `<mark data-quip="${quip}">${text}</mark>`);

  function h(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function spriteEl(name, px, cls = '') {
    const src = sprite(name);
    const c = h('canvas', 'pixel ' + cls);
    if (!src) return c;
    c.width = src.width;
    c.height = src.height;
    c.getContext('2d').drawImage(src, 0, 0);
    c.style.width = src.width * px + 'px';
    c.style.height = src.height * px + 'px';
    return c;
  }

  function linkEl(l) {
    const a = h('a', 'pixel-btn', esc(l.label));
    if (l.href) {
      a.href = l.href;
      a.target = '_blank';
      a.rel = 'noopener';
    } else {
      a.classList.add('placeholder');
      a.title = 'Placeholder – link coming soon';
      a.href = '#';
      a.addEventListener('click', e => e.preventDefault());
    }
    return a;
  }

  function logoEl(label) {
    const { src, framed } = ORG_LOGOS[label];
    const img = h('img', 'card-logo' + (framed ? ' framed' : ''));
    img.alt = label.replace(/ logo$/, '');
    img.src = `assets/logos/${src}.png`;
    return img;
  }

  function buildCard(b) {
    const card = h('article', 'card platform' + (b.wide ? ' wide' : ''));
    const head = h('div', 'card-head');
    if (b.medal) head.appendChild(spriteEl(b.medal, 4, 'card-medal'));
    else if (ORG_LOGOS[b.logo]) head.appendChild(logoEl(b.logo));
    else if (b.logo) head.appendChild(h('div', 'card-logo placeholder', esc(b.logo)));
    const titles = h('div', 'card-titles');
    titles.appendChild(h('h3', null, esc(b.title)));
    if (b.sub) titles.appendChild(h('p', 'card-sub', esc(b.sub)));
    head.appendChild(titles);
    if (b.date) head.appendChild(h('div', 'card-meta', `${esc(b.date)}<br>${esc(b.place || '')}`));
    card.appendChild(head);

    if (b.media && b.media.video) {
      const v = h('video', 'card-media' + (b.media.small ? ' small' : '') + (b.media.loop ? ' clip' : ''));
      v.src = `assets/media/${b.media.video}`;
      v.poster = `assets/media/${b.media.poster}`;
      v.setAttribute('aria-label', b.media.alt);
      v.controls = true;
      v.playsInline = true;
      v.preload = 'metadata';
      // short clips loop silently like a gif; longer videos wait for play
      if (b.media.loop) { v.muted = true; v.loop = true; v.autoplay = true; }
      card.appendChild(v);
    } else if (b.media && b.media.src) {
      const img = h('img', 'card-media' + (b.media.fit ? ' fit' : '') + (b.media.small ? ' small' : ''));
      img.src = `assets/media/${b.media.src}`;
      img.alt = b.media.alt;
      card.appendChild(img);
    } else if (b.media) card.appendChild(h('div', 'card-media placeholder', `IMAGE PLACEHOLDER<br><small>${esc(b.media)}</small>`));

    if (b.bullets) {
      const ul = h('ul');
      b.bullets.forEach(t => ul.appendChild(h('li', null, rich(t))));
      card.appendChild(ul);
    }
    if (b.tags) {
      const tags = h('div', 'tags');
      b.tags.forEach(t => tags.appendChild(h('span', 'tag', esc(t))));
      card.appendChild(tags);
    }
    if (b.links) {
      const links = h('div', 'card-links');
      b.links.forEach(l => links.appendChild(linkEl(l)));
      card.appendChild(links);
    }
    return card;
  }

  function buildChart(b) {
    const card = h('article', 'card chart-card');
    card.appendChild(h('h3', null, esc(b.title)));
    const chart = h('div', 'chart');
    b.bars.forEach(([label, value, note]) => {
      const col = h('div', 'bar-col');
      const bar = h('div', 'bar platform');
      bar.appendChild(h('div', 'bar-value', value));
      bar.style.height = (value - 60) * 4 + 'px';
      bar.dataset.quips = JSON.stringify([`${label}: ${value}!`, note + '!']);
      col.appendChild(bar);
      col.appendChild(h('div', 'bar-label', `${esc(label)}<br><small>${esc(note)}</small>`));
      chart.appendChild(col);
    });
    card.appendChild(chart);
    return card;
  }

  function buildTags(b) {
    const card = h('article', 'card platform' + (b.wide ? ' wide' : ''));
    card.appendChild(h('h3', null, esc(b.title)));
    const tags = h('div', 'tags');
    b.tags.forEach(t => tags.appendChild(h('span', 'tag', esc(t))));
    card.appendChild(tags);
    if (b.quips) card.dataset.quips = JSON.stringify(b.quips);
    return card;
  }

  function buildSkills(b) {
    const card = h('article', 'card platform skills-card' + (b.wide ? ' wide' : ''));
    card.appendChild(h('h3', null, esc(b.title)));
    const grid = h('div', 'skill-grid');
    b.items.forEach(name => {
      const item = h('div', 'skill');
      const icon = sprite(name)
        ? spriteEl(name, 4, 'skill-logo')
        : h('div', 'skill-logo text-logo', esc(name.slice(0, 2).toUpperCase()));
      item.appendChild(icon);
      item.appendChild(h('span', null, esc(name)));
      grid.appendChild(item);
    });
    card.appendChild(grid);
    if (b.quips) card.dataset.quips = JSON.stringify(b.quips);
    return card;
  }

  function buildSim(b) {
    const card = h('article', 'card platform wide sim-card');
    card.appendChild(h('h3', null, esc(b.title)));
    const canvas = h('canvas', 'pixel nav-sim');
    card.appendChild(canvas);
    card.appendChild(h('p', 'sim-legend',
      '<span class="key rigid"></span> rigid obstacle &nbsp; <span class="key soft"></span> compliant (pushable) &nbsp; ' +
      '<span class="key path"></span> contact-aware path &nbsp; <span class="key base"></span> classic path'));
    card.dataset.quips = JSON.stringify(['Pushing through!', 'Shorter path!', 'LiDAR scanning...', 'Classic planner: lost']);
    return card;
  }

  // ---------- research mini simulation ----------

  class NavSim {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.W = 48; this.H = 16; this.C = 4;
      canvas.width = this.W * this.C;
      canvas.height = this.H * this.C;
      this.reset();
    }

    reset() {
      const { W, H } = this;
      this.grid = new Uint8Array(W * H); // 0 free, 1 rigid, 2 compliant
      const rect = (x, y, w, hh, v) => {
        for (let j = y; j < y + hh; j++) for (let i = x; i < x + w; i++) {
          if (i >= 0 && j >= 0 && i < W && j < H) this.grid[j * W + i] = v;
        }
      };
      for (let k = 0; k < 9; k++) rect(6 + Math.floor(Math.random() * 36), Math.floor(Math.random() * H), 1 + Math.floor(Math.random() * 3), 2 + Math.floor(Math.random() * 6), 1);
      for (let k = 0; k < 14; k++) rect(5 + Math.floor(Math.random() * 38), Math.floor(Math.random() * H), 2 + Math.floor(Math.random() * 3), 2 + Math.floor(Math.random() * 4), 2);
      this.start = [1, Math.floor(H / 2)];
      this.goal = [W - 2, 2 + Math.floor(Math.random() * (H - 4))];
      rect(0, this.start[1] - 1, 3, 3, 0);
      rect(W - 3, this.goal[1] - 1, 3, 3, 0);

      this.path = this.astar(4) || [];
      this.basePath = this.astar(Infinity);
      this.seen = new Uint8Array(W * H);
      this.pos = 0;
      this.wait = 0;
      if (this.path.length < 2) this.reset();
    }

    astar(softCost) {
      const { W, H, grid } = this;
      const idx = (x, y) => y * W + x;
      const g = new Float32Array(W * H).fill(Infinity);
      const from = new Int32Array(W * H).fill(-1);
      const s = idx(...this.start), t = idx(...this.goal);
      const open = [s];
      g[s] = 0;
      const hEst = i => Math.abs(i % W - this.goal[0]) + Math.abs(Math.floor(i / W) - this.goal[1]);
      while (open.length) {
        let bi = 0;
        for (let k = 1; k < open.length; k++) if (g[open[k]] + hEst(open[k]) < g[open[bi]] + hEst(open[bi])) bi = k;
        const cur = open.splice(bi, 1)[0];
        if (cur === t) break;
        const cx = cur % W, cy = Math.floor(cur / W);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = cx + dx, ny = cy + dy;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          const n = idx(nx, ny);
          const cell = grid[n];
          const cost = cell === 1 ? Infinity : cell === 2 ? softCost : 1;
          if (!isFinite(cost)) continue;
          if (g[cur] + cost < g[n]) {
            g[n] = g[cur] + cost;
            from[n] = cur;
            if (!open.includes(n)) open.push(n);
          }
        }
      }
      if (!isFinite(g[t])) return null;
      const path = [];
      for (let c = t; c !== -1; c = from[c]) path.push([c % W, Math.floor(c / W)]);
      return path.reverse();
    }

    update(dt, t) {
      if (this.wait > 0) {
        this.wait -= dt;
        if (this.wait <= 0) this.reset();
      } else {
        this.pos = Math.min(this.path.length - 1, this.pos + dt * 7);
        if (this.pos >= this.path.length - 1) this.wait = 1.6;
      }
      const [rx, ry] = this.path[Math.floor(this.pos)];
      const { W, H } = this;
      for (let j = -6; j <= 6; j++) for (let i = -6; i <= 6; i++) {
        const x = rx + i, y = ry + j;
        if (x >= 0 && y >= 0 && x < W && y < H && i * i + j * j <= 36) this.seen[y * W + x] = 1;
      }
      this.draw(rx, ry, t);
    }

    draw(rx, ry, t) {
      const { ctx, W, H, C, grid, seen } = this;
      ctx.fillStyle = '#12061f';
      ctx.fillRect(0, 0, W * C, H * C);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const v = grid[y * W + x];
        const known = seen[y * W + x];
        if (known) {
          ctx.fillStyle = '#2a0f3e';
          ctx.fillRect(x * C, y * C, C, C);
          ctx.fillStyle = '#3a1652';
          ctx.fillRect(x * C, y * C, 1, 1);
        }
        if (v === 1) {
          ctx.fillStyle = known ? '#8a90a0' : '#3a3346';
          ctx.fillRect(x * C, y * C, C, C);
        } else if (v === 2) {
          const pushed = Math.abs(x - rx) + Math.abs(y - ry) <= 1;
          ctx.fillStyle = known ? (pushed ? '#c8ff9a' : '#5aa83a') : '#1f3a1e';
          const o = pushed ? Math.round(Math.sin(t * 30)) : 0;
          ctx.fillRect(x * C + 1 + o, y * C + 1, C - 1, C - 1);
        }
      }
      const dots = (path, col, phase) => {
        if (!path) return;
        ctx.fillStyle = col;
        path.forEach(([x, y], k) => {
          if ((k + phase) % 2 === 0) ctx.fillRect(x * C + 1, y * C + 1, 2, 2);
        });
      };
      dots(this.basePath, '#9aa3b5', 1);
      dots(this.path, '#ff4fe1', 0);

      // LiDAR rays
      ctx.fillStyle = 'rgba(79, 240, 255, 0.55)';
      for (let k = 0; k < 16; k++) {
        const a = (k / 16) * Math.PI * 2 + t;
        for (let r = 1; r < 7; r++) {
          const x = Math.round(rx + Math.cos(a) * r), y = Math.round(ry + Math.sin(a) * r);
          if (x < 0 || y < 0 || x >= W || y >= H || grid[y * W + x] === 1) break;
          if (r % 2 === 0) ctx.fillRect(x * C + 1, y * C + 1, 1, 1);
        }
      }
      // goal flag
      const [gx, gy] = this.goal;
      ctx.fillStyle = '#ffcc33';
      ctx.fillRect(gx * C + 1, gy * C - 4, 1, 8);
      ctx.fillStyle = '#ff3b6b';
      ctx.fillRect(gx * C + 2, gy * C - 4, 3, 3);
      // robot
      ctx.fillStyle = '#4ff0ff';
      ctx.fillRect(rx * C - 1, ry * C - 1, C + 2, C + 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(rx * C + 1, ry * C + 1, 2, 2);
    }
  }

  // ---------- overlay ----------

  const root = h('section', 'section');
  root.id = 'section';
  root.hidden = true;
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.innerHTML = `
    <canvas class="section-planet pixel" aria-hidden="true"></canvas>
    <div class="section-floaters" aria-hidden="true"></div>
    <div class="section-scroll">
      <header class="section-header">
        <button class="pixel-btn back-btn" type="button">&#9664; Back to orbit</button>
        <div class="section-title-row">
          <canvas class="section-icon pixel" aria-hidden="true"></canvas>
          <div>
            <h2 class="section-title"></h2>
            <p class="section-pop"></p>
          </div>
        </div>
        <nav class="contact-links"></nav>
      </header>
      <div class="section-content"></div>
      <footer class="section-footer">Click a creature to say hi &middot; Esc to return to orbit</footer>
    </div>`;
  document.body.appendChild(root);

  const scrollEl = root.querySelector('.section-scroll');
  const content = root.querySelector('.section-content');
  const floatersEl = root.querySelector('.section-floaters');
  const planetCanvas = root.querySelector('.section-planet');
  const iconCanvas = root.querySelector('.section-icon');
  const contactNav = root.querySelector('.contact-links');

  [{ label: 'LinkedIn', href: LINKS.linkedin }, { label: 'Email', href: LINKS.email }, { label: 'GitHub', href: LINKS.github }]
    .forEach(l => contactNav.appendChild(linkEl(l)));

  let current = null;     // open section id
  let state = null;       // per-open runtime state
  let lastOrigin = null;  // planet element the page was opened from
  let openedAt = 0;

  function open(id, originEl, fromHash = false) {
    const sec = SECTIONS.find(s => s.id === id);
    const data = DATA[id];
    if (!sec || !data) return;
    if (current === id) return;
    if (current) teardown();

    current = id;
    openedAt = performance.now();
    lastOrigin = originEl || document.querySelector(`.planet[data-section="${id}"] .planet-body`);
    root.style.setProperty('--accent', sec.accent);
    root.dataset.section = id;

    // header
    root.querySelector('.section-title').textContent = sec.title.replace('\n', ' ');
    const pop = data.population;
    root.querySelector('.section-pop').textContent =
      `Planet population: ${pop.count.toLocaleString('en-GB')} ${pop.name}`;
    const icon = ICONS[sec.icon];
    iconCanvas.width = icon.width;
    iconCanvas.height = icon.height;
    const ictx = iconCanvas.getContext('2d');
    ictx.clearRect(0, 0, icon.width, icon.height);
    ictx.drawImage(icon, 0, 0);
    iconCanvas.style.width = icon.width * 4 + 'px';
    iconCanvas.style.height = icon.height * 4 + 'px';

    // blocks
    content.innerHTML = '';
    const builders = { card: buildCard, chart: buildChart, tags: buildTags, skills: buildSkills, sim: buildSim };
    data.blocks.forEach(b => content.appendChild(builders[b.type](b)));
    const creatureLayer = h('div', 'creature-layer');
    content.appendChild(creatureLayer);

    // big planet horizon
    const vw = window.innerWidth;
    const px = vw < 700 ? 5 : 8;
    const D = Math.round((vw * 1.25) / px);
    const big = new PlanetSprite(sec.style, D, sec.rot * 0.5, null);
    planetCanvas.width = big.size;
    planetCanvas.height = big.size;
    planetCanvas.style.width = big.size * px + 'px';
    planetCanvas.style.height = big.size * px + 'px';
    planetCanvas.style.top = `calc(72vh - ${((big.size - D) / 2) * px}px)`;

    // floaters
    floatersEl.innerHTML = '';
    const floaters = data.floaters.map((name, i) => {
      const el = spriteEl(name, vw < 700 ? 3 : 5, 'floater');
      floatersEl.appendChild(el);
      return {
        el,
        x: ((i + 0.5) / data.floaters.length) * 0.9 + 0.05 + (Math.random() - 0.5) * 0.06,
        y: 0.12 + Math.random() * 0.6,
        ax: 20 + Math.random() * 30, ay: 15 + Math.random() * 25,
        fx: 0.1 + Math.random() * 0.15, fy: 0.12 + Math.random() * 0.15,
        ph: Math.random() * 6.28, spin: (Math.random() - 0.5) * 16,
      };
    });

    // must be laid out (but still clipped away) before platforms can be measured
    root.classList.remove('open');
    root.hidden = false;

    const simCanvas = content.querySelector('.nav-sim');
    state = {
      big, ctx: planetCanvas.getContext('2d'), floaters,
      sim: simCanvas ? new NavSim(simCanvas) : null,
      creatures: [], platforms: [], creatureLayer, data,
      bubbleTimer: 1.2, frame: 0,
    };
    spawnCreatures();

    // reveal: pixel-stepped circle wipe from the clicked planet
    const r = lastOrigin ? lastOrigin.getBoundingClientRect() : { left: vw / 2, top: window.innerHeight / 2, width: 0, height: 0 };
    root.style.setProperty('--cx', r.left + r.width / 2 + 'px');
    root.style.setProperty('--cy', r.top + r.height / 2 + 'px');
    scrollEl.scrollTop = 0;
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('open')));
    document.body.classList.add('section-open');
    root.querySelector('.back-btn').focus({ preventScroll: true });

    if (!fromHash && location.hash !== '#' + id) history.pushState({ section: id }, '', '#' + id);
  }

  function teardown() {
    if (!state) return;
    state.creatures.forEach(c => c.el.remove());
    state = null;
  }

  function close(fromHash = false) {
    if (!current) return;
    const origin = document.querySelector(`.planet[data-section="${current}"] .planet-body`);
    if (origin) {
      const r = origin.getBoundingClientRect();
      root.style.setProperty('--cx', r.left + r.width / 2 + 'px');
      root.style.setProperty('--cy', r.top + r.height / 2 + 'px');
    }
    root.classList.remove('open');
    document.body.classList.remove('section-open');
    const closing = current;
    current = null;
    setTimeout(() => {
      if (current) return; // reopened meanwhile
      root.hidden = true;
      teardown();
      if (origin) origin.focus({ preventScroll: true });
    }, reduceMotion ? 0 : 650);
    if (!fromHash && location.hash === '#' + closing) history.pushState({}, '', location.pathname);
  }

  root.querySelector('.back-btn').addEventListener('click', () => close());
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && current) close(); });
  window.addEventListener('popstate', syncHash);
  window.addEventListener('hashchange', syncHash);
  function syncHash() {
    const id = location.hash.slice(1);
    if (DATA[id]) open(id, null, true);
    else close(true);
  }

  // ---------- creatures on platforms ----------

  const CREATURE_PX = () => (window.innerWidth < 700 ? 3 : 4);

  function measurePlatforms() {
    const base = content.getBoundingClientRect();
    state.platforms = [...content.querySelectorAll('.platform')].map(el => {
      const r = el.getBoundingClientRect();
      return { el, left: r.left - base.left, right: r.right - base.left, top: r.top - base.top };
    }).filter(p => p.right - p.left > 40);
  }

  function spawnCreatures() {
    measurePlatforms();
    const { data } = state;
    const kind = data.population.kind;
    const variants = CREATURES[kind].variants.length;
    const n = Math.min(14, Math.max(5, state.platforms.length * 2));
    const px = CREATURE_PX();
    for (let i = 0; i < n; i++) {
      const frames = framesFor(kind, i % variants);
      const el = h('div', 'creature');
      const canvas = h('canvas', 'pixel');
      canvas.width = frames[0].width;
      canvas.height = frames[0].height;
      canvas.style.width = frames[0].width * px + 'px';
      canvas.style.height = frames[0].height * px + 'px';
      el.appendChild(canvas);
      const bubble = h('div', 'bubble');
      el.appendChild(bubble);
      state.creatureLayer.appendChild(el);

      const plat = state.platforms[i % state.platforms.length];
      const w = frames[0].width * px, hgt = frames[0].height * px;
      const c = {
        el, canvas, ctx: canvas.getContext('2d'), frames, bubble, w, h: hgt,
        plat, x: plat.left + Math.random() * Math.max(1, plat.right - plat.left - w),
        y: 0, dir: Math.random() < 0.5 ? 1 : -1,
        speed: 22 + Math.random() * 26,
        mode: 'walk', timer: 1 + Math.random() * 3,
        jump: null, frame: -1, talk: 0, mark: null,
      };
      el.addEventListener('click', () => { hop(c); say(c, true); });
      state.creatures.push(c);
    }

    // hovering a panel makes its residents jump
    state.platforms.forEach(p => {
      p.el.addEventListener('mouseenter', () => {
        if (!state) return;
        state.creatures.filter(c => c.plat.el === p.el && c.mode !== 'jump').forEach((c, k) => setTimeout(() => hop(c), k * 90));
      });
    });
  }

  function hop(c) {
    if (c.mode === 'jump') return;
    c.mode = 'jump';
    c.jump = { t: 0, dur: 0.45, x0: c.x, x1: c.x, y0: c.plat.top, y1: c.plat.top, hgt: 26, to: c.plat };
  }

  function jumpTo(c, target) {
    const x1 = Math.max(target.left + 4, Math.min(target.right - c.w - 4, c.x + c.dir * 40));
    const dist = Math.hypot(x1 - c.x, target.top - c.plat.top);
    c.mode = 'jump';
    c.jump = { t: 0, dur: Math.min(1.4, 0.5 + dist / 500), x0: c.x, x1, y0: c.plat.top, y1: target.top, hgt: 40 + dist * 0.25, to: target };
  }

  function say(c, force = false) {
    if (c.talk > 0 && !force) return;
    const el = c.plat.el;
    const card = el.closest('.card') || el;
    const marks = [...card.querySelectorAll('mark[data-quip]')];
    let text;
    if (marks.length && Math.random() < 0.8) {
      const m = marks[Math.floor(Math.random() * marks.length)];
      text = m.dataset.quip;
      if (c.mark) c.mark.classList.remove('pulse');
      c.mark = m;
      m.classList.add('pulse');
    } else {
      const own = el.dataset.quips ? JSON.parse(el.dataset.quips) : card.dataset.quips ? JSON.parse(card.dataset.quips) : [];
      const pool = own.length && Math.random() < 0.75 ? own : state.data.quips;
      text = pool[Math.floor(Math.random() * pool.length)];
    }
    c.bubble.textContent = text;
    c.bubble.classList.add('show');
    c.talk = 2.6;
    if (c.mode === 'walk') { c.mode = 'idle'; c.timer = 2.4; }
  }

  function updateCreatures(dt, t) {
    const s = state;
    s.bubbleTimer -= dt;
    if (s.bubbleTimer <= 0 && s.creatures.length) {
      const talkers = s.creatures.filter(c => c.talk > 0).length;
      if (talkers < 3) say(s.creatures[Math.floor(Math.random() * s.creatures.length)]);
      s.bubbleTimer = 0.9 + Math.random() * 1.6;
    }

    for (const c of s.creatures) {
      if (c.talk > 0) {
        c.talk -= dt;
        if (c.talk <= 0) {
          c.bubble.classList.remove('show');
          if (c.mark) { c.mark.classList.remove('pulse'); c.mark = null; }
        }
      }

      let y = c.plat.top;
      if (c.mode === 'jump') {
        const j = c.jump;
        j.t += dt / j.dur;
        const k = Math.min(1, j.t);
        c.x = j.x0 + (j.x1 - j.x0) * k;
        y = j.y0 + (j.y1 - j.y0) * k - 4 * j.hgt * k * (1 - k);
        if (k >= 1) {
          c.plat = j.to;
          c.mode = 'walk';
          c.timer = 1 + Math.random() * 3;
          y = c.plat.top;
        }
      } else if (c.mode === 'idle') {
        c.timer -= dt;
        if (c.timer <= 0) { c.mode = 'walk'; c.timer = 2 + Math.random() * 4; }
      } else {
        c.x += c.dir * c.speed * dt;
        c.timer -= dt;
        const atEdge = c.x < c.plat.left + 2 || c.x + c.w > c.plat.right - 2;
        if (atEdge) {
          c.x = Math.max(c.plat.left + 2, Math.min(c.plat.right - c.w - 2, c.x));
          // sometimes leap to a neighbouring panel, otherwise turn around
          const others = s.platforms.filter(p => p !== c.plat && Math.abs(p.top - c.plat.top) < 420 &&
            (c.dir > 0 ? p.left > c.plat.left : p.right < c.plat.right));
          if (others.length && Math.random() < 0.35 && !reduceMotion) jumpTo(c, others[Math.floor(Math.random() * others.length)]);
          else c.dir *= -1;
        } else if (c.timer <= 0) {
          if (Math.random() < 0.5) { c.mode = 'idle'; c.timer = 0.8 + Math.random() * 2; }
          else c.dir *= -1;
          if (c.mode === 'walk') c.timer = 2 + Math.random() * 4;
        }
      }

      const moving = c.mode !== 'idle';
      const frame = moving ? Math.floor(t * 7) % 2 : 0;
      if (frame !== c.frame) {
        c.ctx.clearRect(0, 0, c.canvas.width, c.canvas.height);
        c.ctx.drawImage(c.frames[frame], 0, 0);
        c.frame = frame;
      }
      c.el.style.transform = `translate3d(${c.x}px, ${y - c.h + 2}px, 0)`;
      c.canvas.style.transform = `scaleX(${c.dir})`;
    }
  }

  // ---------- per-frame update (called from main loop) ----------

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (!state) return;
      measurePlatforms();
      for (const c of state.creatures) {
        const same = state.platforms.find(p => p.el === c.plat.el) || state.platforms[0];
        c.plat = same;
        c.x = Math.max(same.left, Math.min(same.right - c.w, c.x));
      }
    }, 150);
  });

  // panels can change height as fonts/images load
  new ResizeObserver(() => {
    if (!state) return;
    measurePlatforms();
    for (const c of state.creatures) {
      c.plat = state.platforms.find(p => p.el === c.plat.el) || state.platforms[0];
    }
  }).observe(content);

  function update(dt, t) {
    if (!state || root.hidden) return;
    const s = state;
    s.frame++;
    // the horizon planet turns slowly, so redrawing it every 4th frame is plenty
    if (s.frame === 1 || (!reduceMotion && s.frame % 4 === 0)) {
      s.big.render(reduceMotion ? 0 : t);
      s.ctx.clearRect(0, 0, planetCanvas.width, planetCanvas.height);
      s.ctx.drawImage(s.big.canvas, 0, 0);
    }

    const vw = window.innerWidth, vh = window.innerHeight;
    for (const f of s.floaters) {
      const x = f.x * vw + (reduceMotion ? 0 : Math.sin(t * f.fx + f.ph) * f.ax);
      const y = f.y * vh + (reduceMotion ? 0 : Math.sin(t * f.fy + f.ph * 1.3) * f.ay);
      const rot = reduceMotion ? 0 : Math.sin(t * 0.3 + f.ph) * f.spin;
      f.el.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rot}deg)`;
    }
    if (s.sim) s.sim.update(dt, t);
    updateCreatures(dt, t);
  }

  // true once the page fully covers the orbit scene, which can then pause
  const covering = () => !!current && performance.now() - openedAt > 800;

  window.Sections = { open, close, update, syncHash, covering };
})();
