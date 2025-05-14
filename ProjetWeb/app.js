// Initialisation de la scène, de la caméra et du renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 4000);
    camera.position.z = 20;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.outputColorSpace = THREE.SRGBColorSpace; // Pour Three.js r150+
    //renderer.setClearColor(0xffffff);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: null
    };
    

    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Lumière ambiante et directionnelle
    const ambientLight = new THREE.AmbientLight(0xffffff, 5);
    scene.add(ambientLight);

    /*const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);*/

    // Création des 6 faces du cube comme objets séparés, avec couleurs aléatoires
    const size = 1;
    const faces = [];
    const materials = [];

    // On crée d'abord les matériaux pour pouvoir remplacer celui de la face avant ensuite
    for (let i = 0; i < 6; i++) {
      
      const randomColor = Math.floor(Math.random() * 0xffffff);
      let material = new THREE.MeshBasicMaterial();
      material.side = THREE.DoubleSide;
      /*if (i === 0) {
         material = new THREE.MeshPhongMaterial({ color: 0xffffff });
      }
      else{
         material = new THREE.MeshPhongMaterial({ color: randomColor });
      }*/
      
      materials.push(material);
    }

    for (let i = 0; i < 6; i++) {
      const geometry = new THREE.PlaneGeometry(size, size);
      const mesh = new THREE.Mesh(geometry, materials[i]);
      
      faces.push(mesh);
    }

    const faceDivs = [];
    for (let i = 1; i <= 6; i++) {
      faceDivs.push(document.getElementById('face' + i));
    }

    // Positionnement et orientation des faces
    faces[0].position.set(0, 0, size/2); // Face avant
    faces[1].position.set(0, 0, -size/2); faces[1].rotateY(Math.PI); // Face arrière
    faces[2].position.set(-size/2, 0, 0); faces[2].rotateY(-Math.PI/2); // Face gauche
    faces[3].position.set(size/2, 0, 0); faces[3].rotateY(Math.PI/2); // Face droite
    faces[4].position.set(0, size/2, 0); faces[4].rotateX(-Math.PI/2); // Face haut
    faces[5].position.set(0, -size/2, 0); faces[5].rotateX(Math.PI/2); // Face bas

    // Groupe pour le cube (pas de rotation)
    const cubeGroup = new THREE.Group();
    faces.forEach(face => cubeGroup.add(face));
    scene.add(cubeGroup);

    // Génération du fond étoilé (particules)
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 2000;
    const positions = [];
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 2000 - Math.random() * 100  ; // rayon autour du cube
      positions.push(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );
    }
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 8   });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // Variables pour l’animation de la caméra
    let cameraAnimState = 'orbit'; // 'orbit', 'moveToFace', 'zoomIn', 'zoomOut', 'idle'
    let cameraTarget = null;
    let cameraZoomTarget = null;
    let lookAtTarget = new THREE.Vector3(0, 0, 0);
    const animationSpeed = 0.05;
    

    const radius = 3;       // Rayon d'orbite initial
    const finalRadius = 1.215; // Rayon final (zoom)

    // Raycaster et souris pour la détection de clic
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let currentMaterial;
    let faceIndex;

    


    renderer.domElement.addEventListener('mousedown', function(e) {
        if (e.button === 2) {
          e.preventDefault();
          e.stopImmediatePropagation();
        }
      });

      let grabbing = false;

      renderer.domElement.addEventListener('mousedown',function(e) {
        if (e.button === 0 && cameraAnimState === 'orbit') {
          cameraAnimState = 'control';
          if(spaceHover){
            renderer.domElement.style.cursor = 'grabbing'
            grabbing = true;
          }
          
        }
        
      });

      renderer.domElement.addEventListener('mouseup',function(e) {
        if (e.button === 0  && grabbing) {
          grabbing = false;
        }
        
      });

      

      let spaceHover = false;

      renderer.domElement.addEventListener('mousemove', (event) => {
        // Calculer la position de la souris en coordonnées normalisées
        const canvas = document.getElementById("")
        const rect = renderer.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2(
          ((event.clientX - rect.left) / rect.width) * 2 - 1,
          -((event.clientY - rect.top) / rect.height) * 2 + 1
        );

        // Raycast pour détecter le survol du cube
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(faces);

        if(!grabbing){
          if(intersects.length === 0){
          renderer.domElement.style.cursor = 'grab';
          spaceHover = true;
        }
        else {
          renderer.domElement.style.cursor = 'pointer';
          spaceHover = false
        }
        }
        
    });


      let selectedFaceIdx = null;
      let faceUpVector = new THREE.Vector3(0, 1, 0);

      renderer.domElement.addEventListener('click', (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      //faceDivs.forEach(div => div.style.display = 'none');

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(faces);
      
      if (intersects.length > 0) {
        currentMaterial = intersects[0];
        const normalMatrix = new THREE.Matrix3().getNormalMatrix(intersects[0].object.matrixWorld);
        const normal = intersects[0].face.normal.clone().applyMatrix3(normalMatrix).normalize();

        cameraTarget = normal.clone().multiplyScalar(radius).add(cubeGroup.position);
        cameraZoomTarget = normal.clone().multiplyScalar(finalRadius).add(cubeGroup.position);
        lookAtTarget = cubeGroup.position.clone().add(normal.clone().multiplyScalar(0.01));

        



        cameraAnimState = 'moveToFace';
        faceIndex = faces.indexOf(intersects[0].object);
        console.log(faceIndex)
        faceIdx = faceIndex;

        

        if (faceIndex !== -1) {
          faceDiv = faceDivs[faceIndex];
        }
      } else if(cameraAnimState === 'idle' && faceIndex !== -1) {
        const direction = camera.position.clone().sub(cubeGroup.position).normalize();
        cameraTarget = direction.clone().multiplyScalar(radius).add(cubeGroup.position);
        lookAtTarget = cubeGroup.position.clone();
        console.log(faceIndex)

        updateFaceTextureFromDiv(faceDiv, faceIndex).then(() => {
          cameraAnimState = 'zoomOut';
        });
       

        faceIndex = null;
      }
      else if(cameraAnimState === 'control'){
        const relPos = camera.position.clone().sub(cubeGroup.position);
          const r = relPos.length();
          
          theta = Math.atan2(relPos.z, relPos.x);
          
          const cosPhi = camera.position.y / r;
          
          phi = Math.acos(Math.max(-1, Math.min(1, cosPhi)));
          
          //verticalTime = 2 * Math.asin((phi - Math.PI/2) / (Math.PI/4));  
        cameraAnimState = 'orbit';
        
        
      }
    });

    // Animation principale
    let theta = 0;
    let phi = 0;
    let verticalTime = 0;
    let faceDiv;
    function animate() {
      requestAnimationFrame(animate);
      
      if(cameraAnimState === 'control'){
        controls.enabled = true;
        controls.update();
      }
      else if (cameraAnimState === 'orbit') {

        controls.enabled = true;
        theta += 0.002;

        camera.position.x = radius * Math.sin(phi) * Math.cos(theta);
        camera.position.y = radius * Math.cos(phi);
        camera.position.z = radius * Math.sin(phi) * Math.sin(theta);
        camera.lookAt(0, 0, 0);
      } else if (cameraAnimState === 'moveToFace' && cameraTarget) {
        controls.enabled = false;
        camera.position.lerp(cameraTarget, animationSpeed);

        


        
        camera.lookAt(lookAtTarget);

        if (camera.position.distanceTo(cameraTarget) < 0.02) {
          camera.position.copy(cameraTarget);
          camera.lookAt(lookAtTarget);
          
          cameraAnimState = 'zoomIn';
        }

      } else if (cameraAnimState === 'zoomIn' && cameraZoomTarget) {
        camera.position.lerp(cameraZoomTarget, animationSpeed);
        camera.lookAt(lookAtTarget);

        

        if (camera.position.distanceTo(cameraZoomTarget) < 0.001) {
          camera.position.copy(cameraZoomTarget);
          camera.lookAt(lookAtTarget);
          
          cameraAnimState = 'idle';
          faceDiv.style.display = 'flex';
          faceDiv.style.left = '50%';
          faceDiv.style.transform = 'translateX(-50%)';
        }


      } else if (cameraAnimState === 'zoomOut' && cameraTarget) {
        camera.position.lerp(cameraTarget, animationSpeed);
        camera.lookAt(lookAtTarget);

        if (camera.position.distanceTo(cameraTarget) < 0.001) {
          camera.position.copy(cameraTarget);
          camera.lookAt(lookAtTarget);

          // Calculer les nouveaux theta/phi pour reprendre l'orbite au bon endroit
          const relPos = camera.position.clone().sub(cubeGroup.position);
          const r = relPos.length();
          theta = Math.atan2(relPos.z, relPos.x);
          
          const cosPhi = relPos.y / r;
          
          phi = Math.acos(Math.max(-1, Math.min(1, cosPhi)));

          if(faceIdx===4){
            phi += 0.001;
            theta = Math.PI/2;
            faceIdx = null;
          }
        
          cameraAnimState = 'orbit';
          
        }
      }
      

      renderer.render(scene, camera);
    }

    function updateFaceTextureFromDiv(div, faceIndex) {
      
      div.style.display = 'flex';

      return html2canvas(div).then(canvas => {
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace; // Pour Three.js r150+

        console.log(faceIndex);
        console.log(materials[faceIndex].map);
        materials[faceIndex].map = texture;
        console.log(materials[faceIndex].map);
        materials[faceIndex].needsUpdate = true;
        div.style.display = 'none';
        
      });
      
    }



   Promise.all(faceDivs.map(div => html2canvas(div))).then(canvases => {
  canvases.forEach((canvas, i) => {
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace; // Pour Three.js r150+

    materials[i].map = texture;
    console.log(materials[i].map)
    materials[i].needsUpdate = true;
    faceDivs[i].style.display = 'none'; // Cache la div après capture
  });
  faceDivs[4].style.display = 'flex';
  faceDivs[4].style.left = '50%';
  faceDivs[4].style.transform = 'translateX(-50%)';
});

document.getElementById('pret').addEventListener('click', function() {
  
  // Remettre les styles demandés sur #face5
  const face5 = document.getElementById('face5');
  face5.style.width = '100vh';
  face5.style.aspectRatio = '1';

  // Remettre les styles demandés sur .inner-border de face5
  const inner = face5.querySelector('.inner-border');
  inner.style.width = '100vh';
  inner.style.aspectRatio = '1';

  const btn = document.getElementById('pret');
  btn.style.display = 'none';


  setTimeout(() => {
    updateFaceTextureFromDiv(faceDivs[4], 4).then(() => {
          cameraAnimState = 'zoomOut';
          
  });
  }, 1000);

  // Début du chrono
  startTime = Date.now();
  
});

/*document.addEventListener('DOMContentLoaded', function() {
  const key = document.getElementById('magic-key');
  key.addEventListener('click', function() {
    // Génère un mot de passe aléatoire de 4 à 5 caractères
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const len = 4;
    let pass = '';
    for (let i = 0; i < len; i++) {
      pass += chars[Math.floor(Math.random() * chars.length)];
    }
    key.textContent = pass;
    key.style.pointerEvents = 'none'; // Désactive le clic après
    key.style.textDecoration = 'none';
    key.style.color = '#ffd700';
  });
});*/

document.getElementById('magic-key').addEventListener('click', function() {
  fetch('generate_code.php')
    .then(res => res.text())
    .then(code => {
      this.textContent = code;
      this.style.color = 'gold';
      this.style.pointerEvents = 'none';
    });
});





let temps;
document.getElementById('verify-btn').addEventListener('click', function() {
  const code = document.getElementById('code-input1').value;
  fetch('verify_code.php', {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: 'code=' + encodeURIComponent(code)
  })
  .then(res => res.text())
  .then(result => {
    if(result === "OK"){

      document.getElementById('pseudo-container').style.display = 'block';
      faceDivs[5].classList.add('grand');
      // Fin du chrono
      const endTime = Date.now();
      temps = Math.round((endTime - startTime) / 1000);
      document.getElementById('code-input1').style.display ="none";
      document.getElementById('code-input2').style.display ="none";
      document.getElementById('code-input3').style.display ="none";
      document.getElementById('verify-btn').style.display ="none";
    }
    
  });
  
  
});

document.getElementById('submit-score').addEventListener('click', function() {
      const pseudo = document.getElementById('pseudo').value.trim();
            if (!pseudo) return alert("Entre ton pseudo !");
            fetch('leaderboard_add.php', {
                  method: 'POST',
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify({ pseudo, temps })
                })
                .then(res => res.json())
                .then(data => {
                  
                  // Affiche le leaderboard à jour
                  fetch('leaderboard_get.php')
                  .then(res => res.json())
                  .then(data => {
                    document.getElementById('submit-score').style.display ="none";
                    document.getElementById('pseudo').style.display ="none";
                    document.getElementById("leaderboard-container").style.display  = "block";
                    afficherLeaderboard(data);
                  });
                });
});

function afficherLeaderboard(data) {
  const ul = document.getElementById('leaderboard');
  ul.innerHTML = '';
  data.forEach((entry, i) => {
    ul.innerHTML += `<li>#${i+1} - ${entry.pseudo} : ${entry.temps} sec</li>`;
  });
}

fetch('generate_code.php')
    .then(res => res.text())
    .then(code => {
      for (let i = 0; i < code.length; i++) {
        const span = document.getElementById('c' + (i+1));
        if (span) span.textContent = code[i];
      }
    });
//// ---------------------------- SImon -----------------------------------------

document.addEventListener('DOMContentLoaded', function() {
    const colors = ['red', 'green', 'blue', 'yellow'];
    let sequence = [];
    let userStep = 0;
    let playing = false;
    let canClick = false;
  
    const btns = Array.from(document.querySelectorAll('.simon-btn'));
    const startBtn = document.getElementById('simon-start');
    const msg = document.getElementById('simon-message');
  
    
  
    function flashButton(color) {
      const btn = btns.find(b => b.dataset.color === color);
      if (!btn) return;
      btn.classList.add('active');
      
      setTimeout(() => btn.classList.remove('active'), 180);
    }
  
    function showMessage(text, color="#222222") {
      msg.textContent = text;
      msg.style.color = color;
    }
  
    function playSequence(seq, idx=0) {
      canClick = false;
      if (idx < seq.length) {
        flashButton(seq[idx]);
        setTimeout(() => playSequence(seq, idx+1), 400);
      } else {
        setTimeout(() => {
          canClick = true;
          
        }, 300);
      }
    }
  
    function nextRound() {
      sequence.push(colors[Math.floor(Math.random()*4)]);
      
      setTimeout(() => playSequence(sequence), 600);
      userStep = 0;
    }
  
    function resetGame() {
      sequence = [];
      userStep = 0;
      playing = false;
      canClick = false;
      
    }
  
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (!canClick) return;
        const color = btn.dataset.color;
        flashButton(color);
        if (color === sequence[userStep]) {
          userStep++;
          if (userStep === sequence.length) {
            if (sequence.length === 5) { // 5 rounds pour gagner
              fetch('generate_code.php')
              .then(res => res.text())
              .then(code => {
                showMessage( code, "gold");
              });
              
              playing = false;
              canClick = false;
            } else {
              
              setTimeout(nextRound, 1000);
            }
          }
        } else {
          showMessage("Raté ! Réessaie.", "red");
          playing = false;
          canClick = false;
        }
      });
    });
  
    startBtn.addEventListener('click', () => {
      if (playing) return;
      playing = true;
      sequence = [];
      userStep = 0;
      setTimeout(nextRound, 800);
    });
  
    // Init
    resetGame();
  });
  



// ------------------------------ Attributs au lancement ----------------------------------------------
   
    
  let faceIdx = 4;  
  faceDiv =  faceDivs[4]; 
  faceIndex = 4;
  faceDiv.style.display = 'flex';
  faceDiv.style.left = '50%';
  faceDiv.style.transform = 'translateX(-50%)';

  const normalMatrix = new THREE.Matrix3().getNormalMatrix(faces[faceIdx].matrixWorld);
  
  const normal = new THREE.Vector3(0, 1, 0).applyMatrix3(normalMatrix).normalize();

  cameraTarget = normal.clone().multiplyScalar(radius).add(cubeGroup.position);
  cameraZoomTarget = normal.clone().multiplyScalar(finalRadius).add(cubeGroup.position);
  lookAtTarget = cubeGroup.position.clone().add(normal.clone().multiplyScalar(0.01));
  cameraAnimState = 'moveToFace';
  
  // ---------------------------------------------------------------------------------------------------
  animate();

    // Responsive
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });