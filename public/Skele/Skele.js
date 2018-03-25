import React from "react";
import ReactDOM from "react-dom";
import $ from "./dependencies/jquery-2.2.1.min";
import TWEEN from "@tweenjs/tween.js";
import "./dependencies/OBJLoader";
import "./dependencies/ctm";
import "./dependencies/CTMLoader";
import "./dependencies/Projector";
import "./dependencies/OrbitControls";
import WIKIPEDIA from "./dependencies/wikipedia";
import "./dependencies/bootstrap.min.css";
import "./dependencies/Skele.css";
import * as THREE from "three";

const target = document.createElement("div");
// noinspection JSValidateTypes
target.id = Math.random() * 100;
// noinspection XHTMLIncompatabilitiesJS
document.currentScript.parentNode.insertBefore(target, document.currentScript);

class Skele extends React.Component {
	componentDidMount(){
		SkeleRender();
	}
	componentDidUpdate(){
		SkeleRender();
	}
	render() {
		return <div>
			<button id="hide-btn" className="btn btn-success btn-xs button-style">Hide Information</button>

			<div id="stuff" className="information">
				<h3 id="heading">Controls</h3>
				<div id="description">
					<ul>
						<li>Click/Tap on a bone to view more information.</li>
						<li>Click and drag with mouse to rotate.</li>
						<li>If you are on a touch device,swipe to orbit the model.</li>
						<li>Use your scroll wheel to zoom in or out.</li>
						<li>If you are on a touch device, pinch appropriately to zoom.</li>
					</ul>

					<br/>Powered by <a href="http://threejs.org/" target="_blank">three.js</a>. Other beautiful
					resources
					used: <a
					href="http://www.createjs.com/tweenjs">Tween.js</a> and <a
					href="http://bootswatch.com/">BootSwatch</a>.
				</div>
				<div className="loading" style={{display: "none"}}>
					<strong>Loading</strong>
					<img src="https://calcplot3.firebaseapp.com/Skele/ajaxload-circle.gif"/>
				</div>

				<div className="results" style={{display: "none"}}>
					<div className="summary well">
						<h4>
							<span className="title"/>
						</h4>

						<p className="summary"/>
						<div className="clear"/>
					</div>
				</div>
			</div>
		</div>;
	}
}

function SkeleRender(){
	const PATH = "https://calcplot3.firebaseapp.com/Skele/";
	let container;
	let controls;
	let camera, scene, renderer;


	// custom global variables

	let projector;
	const mouse = {
		x: 0,
		y: 0
	};
	let INTERSECTED;


	document.addEventListener("DOMContentLoaded", start_app, false);


	function start_app() {
		init();
		animate();
	}

	function init() {
		let context;
		let materials;
		container = document.createElement('div');
		target.appendChild(container);
		camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 100000);
		camera.position.z = 1050;


		// scene
		scene = new THREE.Scene();


		const geometry = new THREE.BoxGeometry(0, 0, 0);
		const material = new THREE.MeshBasicMaterial({
			color: 0x00ff00
		});
		let Cube = new THREE.Mesh(geometry, material);
		scene.add(Cube);

		window.cube = Cube;


		const ambient = new THREE.AmbientLight(0x101030);
		scene.add(ambient);

		let directionalLight = new THREE.DirectionalLight(0xCABA7B);
		directionalLight.position.set(0, 0, 0.1);
		scene.add(directionalLight);

		// noinspection ReuseOfLocalVariableJS
		directionalLight = new THREE.DirectionalLight(0xCABA7B);
		directionalLight.position.set(0, 0, -1);
		scene.add(directionalLight);


		const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
		dirLight.position.set(100, 100, 50);
		scene.add(dirLight);

		//skybox
		const texture_placeholder = document.createElement('canvas');

		context = texture_placeholder.getContext('2d');
		context.fillStyle = 'rgb( 200, 200, 200 )';
		context.fillRect(0, 0, texture_placeholder.width, texture_placeholder.height);
		materials = [];
		let mesh = new THREE.Mesh(new THREE.BoxGeometry(3000, 3000, 3000, 7, 7, 7), materials);
		mesh.scale.x = -1;
		scene.add(mesh);

		function centroidCalculator(geometry) {
			const centroid = new THREE.Vector3();
			geometry.computeBoundingBox();
			centroid.addVectors(geometry.boundingBox.min, geometry.boundingBox.max);
			centroid.multiplyScalar(0.5);
			centroid.applyMatrix4(mesh.matrixWorld);
			return centroid;
		}

		function load(path, name, link, mirror) {
			const loader = new THREE.CTMLoader();
			path = PATH+path;
			loader.load(path, function (geometry, material) {
				// create mesh and position it
				let material1 = new THREE.MeshPhongMaterial({
						color: 0xFFEC9F,
						shininess: 15,
						side: THREE.DoubleSide
					}),
					mesh1 = new THREE.Mesh(geometry, material1);
				mirror ? geometry.scale(-1, 1, 1) : null;
				scene.add(mesh1);
				mesh1.name = name;
				mesh1.userData = centroidCalculator(geometry);
				mesh1.userData.link = link;

			}, {});
		}

		load('ctm/Skull.ctm', "Skull", "Human_skull");
		load('ctm/Mandible.ctm', "Mandible", "Mandible");
		load('ctm/Sacrum.ctm', "Sacrum", "Sacrum");
		load('ctm/C1.ctm', "Atlas Vertebra", "Atlas_(anatomy)");
		load('ctm/C2.ctm', "Axis", "Axis_(anatomy)");
		load('ctm/C3.ctm', "C3 Vertebra", "Cervical_vertebrae");
		load('ctm/C4.ctm', "C4 Vertebra", "Cervical_vertebrae");
		load('ctm/C5.ctm', "C5 Vertebra", "Cervical_vertebrae");
		load('ctm/C6.ctm', "C6 Vertebra", "Cervical_vertebrae");
		load('ctm/C7.ctm', "C7 Vertebra", "Cervical_vertebrae");
		load('ctm/L1.ctm', "L1 Vertebra", "Lumbar_vertebrae");
		load('ctm/L2.ctm', "L2 Vertebra", "Lumbar_vertebrae");
		load('ctm/L3.ctm', "L3 Vertebra", "Lumbar_vertebrae");
		load('ctm/L4.ctm', "L4 Vertebra", "Lumbar_vertebrae");
		load('ctm/L5.ctm', "L5 Vertebra", "Lumbar_vertebrae");
		load('ctm/T1.ctm', "T1 Vertebra", "Thoracic_vertebrae");
		load('ctm/T2.ctm', "T2 Vertebra", "Thoracic_vertebrae");
		load('ctm/T3.ctm', "T3 Vertebra", "Thoracic_vertebrae");
		load('ctm/T4.ctm', "T4 Vertebra", "Thoracic_vertebrae");
		load('ctm/T5.ctm', "T5 Vertebra", "Thoracic_vertebrae");
		load('ctm/T6.ctm', "T6 Vertebra", "Thoracic_vertebrae");
		load('ctm/T7.ctm', "T7 Vertebra", "Thoracic_vertebrae");
		load('ctm/T8.ctm', "T8 Vertebra", "Thoracic_vertebrae");
		load('ctm/T9.ctm', "T9 Vertebra", "Thoracic_vertebrae");
		load('ctm/T10.ctm', "T10 Vertebra", "Thoracic_vertebrae");
		load('ctm/T11.ctm', "T11 Vertebra", "Thoracic_vertebrae");
		load('ctm/T12.ctm', "T12 Vertebra", "Thoracic_vertebrae");
		load('ctm/ribs/rL1.ctm', "1st Rib", "Rib_cage");
		load('ctm/ribs/rL2.ctm', "2nd Rib", "Rib_cage");
		load('ctm/ribs/rL3.ctm', "3rd Rib", "Rib_cage");
		load('ctm/ribs/rL4.ctm', "4th Rib", "Rib_cage");
		load('ctm/ribs/rL5.ctm', "5th Rib", "Rib_cage");
		load('ctm/ribs/rL6-10.ctm', "6th to 10th Ribs", "Rib_cage");
		load('ctm/ribs/rR1.ctm', "1st Rib", "Rib_cage");
		load('ctm/ribs/rR2.ctm', "2nd Rib", "Rib_cage");
		load('ctm/ribs/rR3.ctm', "3rd Rib", "Rib_cage");
		load('ctm/ribs/rR4.ctm', "4th Rib", "Rib_cage");
		load('ctm/ribs/rR5.ctm', "5th Rib", "Rib_cage");
		load('ctm/ribs/rR6-10.ctm', "6th to 10th Ribs", "Rib_cage");
		load('ctm/UL/Left_Clavicle.ctm', "Left Clavicle");

		// this is awesome : controls.target.set( 550, 50, 100 ),"Clavicle");
		load('ctm/UL/Left_Humerus.ctm', "Left Humerus", "Humerus");
		load('ctm/UL/Left_Radius.ctm', "Left Radius", "Radius_(bone)");
		load('ctm/UL/Left_Ulna.ctm', "Left Ulna", "Ulna");
		load('ctm/UL/Left_Scapula.ctm', "Left Scapula", "Scapula");


		//right sided mirrors of upper bigger bones
		load('ctm/UL/Right_Clavicle.ctm', "Right Clavicle");

		// this is awesome : controls.target.set( 550, 50, 100 ),"Clavicle");
		load('ctm/UL/Right_Humerus.ctm', "Right Humerus", "Humerus");
		load('ctm/UL/Right_Radius.ctm', "Right Radius", "Radius_(bone)");
		load('ctm/UL/Right_Ulna.ctm', "Right Ulna", "Ulna");
		load('ctm/UL/Right_Scapula.ctm', "Right Scapula", "Scapula");


		//Left Sided Wrist Bones
		load('ctm/UL/left/LCapitate.ctm', "Left Capitate", "Capitate_bone");
		load('ctm/UL/left/LHamate.ctm', "Left Hamate", "Hamate_bone");
		load('ctm/UL/left/LLunate.ctm', "Left Lunate", "Lunate_bone");
		load('ctm/UL/left/LPisiform.ctm', "Left Pisiform", "Pisiform_bone");
		load('ctm/UL/left/LScaphoid.ctm', "Left Scaphoid", "Scaphoid_bone");


		load('ctm/UL/left/LTrapezium.ctm', "Left Trazpezium", "Trapezium_(bone)");
		load('ctm/UL/left/LTrapezoid.ctm', "Left Trapezoid", "Trapezoid_bone");
		load('ctm/UL/left/LTriquetrum.ctm', "Left Triquetrum", "Triquetral_bone");
		load('ctm/UL/left/metacarpals/L1.ctm', "Left 1st metacarpal", "First_metacarpal_bone");
		load('ctm/UL/left/metacarpals/L2.ctm', "Left 2nd metacarpal", "Second_metacarpal_bone");
		load('ctm/UL/left/metacarpals/L3.ctm', "Left 3rd metacarpal", "Third_metacarpal_bone");


		load('ctm/UL/left/metacarpals/L4.ctm', "Left 4th metacarpal", "Fourth_metacarpal_bone");


		load('ctm/UL/left/metacarpals/L5.ctm', "Left 5th metacarpal", "Fifth_metacarpal_bone");


		//left phalanges

		load('ctm/UL/left/phalanges/1-1.ctm', "Pollex- Proximal Phalynx", "Phalanx_bone");
		load('ctm/UL/left/phalanges/1-2.ctm', "Pollex- Distal Phalynx", "Phalanx_bone");
		load('ctm/UL/left/phalanges/2-1.ctm', "Index- Proximal Phalynx", "Phalanx_bone");


		load('ctm/UL/left/phalanges/2-2.ctm', "Index- Middle Phalynx", "Phalanx_bone");
		load('ctm/UL/left/phalanges/2-3.ctm', "Index- Distal Phalynx", "Phalanx_bone");
		load('ctm/UL/left/phalanges/3-1.ctm', "Middle Finger- Proximal Phalynx", "Phalanx_bone");
		load('ctm/UL/left/phalanges/3-2.ctm', "Middle Finger- Middle Phalynx", "Phalanx_bone");
		load('ctm/UL/left/phalanges/3-3.ctm', "Middle Finger- Distal Phalynx", "Phalanx_bone");
		load('ctm/UL/left/phalanges/4-1.ctm', "Ring Finger- Proximal Phalynx", "Phalanx_bone");
		load('ctm/UL/left/phalanges/4-2.ctm', "Ring Finger- Middle Phalynx", "Phalanx_bone");
		load('ctm/UL/left/phalanges/4-3.ctm', "Ring Finger- Distal Phalynx", "Phalanx_bone");
		load('ctm/UL/left/phalanges/5-1.ctm', "Pinky Finger- Proximal Phalynx", "Phalanx_bone");
		load('ctm/UL/left/phalanges/5-2.ctm', "Pinky Finger- Middle Phalynx", "Phalanx_bone");
		load('ctm/UL/left/phalanges/5-3.ctm', "Pinky Finger- Distal Phalynx", "Phalanx_bone");


		//Right Sided Mirror Wrist Bones
		load('ctm/UL/left/LCapitate.ctm', "Right Capitate", "Capitate_bone", true);
		load('ctm/UL/left/LHamate.ctm', "Right Hamate", "Hamate_bone", true);
		load('ctm/UL/left/LLunate.ctm', "Right Lunate", "Lunate_bone", true);
		load('ctm/UL/left/LPisiform.ctm', "Right Pisiform", "Pisiform_bone", true);
		load('ctm/UL/left/LScaphoid.ctm', "Right Scaphoid", "Scaphoid_bone", true);


		load('ctm/UL/left/LTrapezium.ctm', "Right Trazpezium", "Trapezium_(bone)", true);
		load('ctm/UL/left/LTrapezoid.ctm', "Right Trapezoid", "Trapezoid_bone", true);
		load('ctm/UL/left/LTriquetrum.ctm', "Right Triquetrum", "Triquetral_bone", true);
		load('ctm/UL/left/metacarpals/L1.ctm', "Right 1st metacarpal", "First_metacarpal_bone", true);
		load('ctm/UL/left/metacarpals/L2.ctm', "Right 2nd metacarpal", "Second_metacarpal_bone", true);
		load('ctm/UL/left/metacarpals/L3.ctm', "Right 3rd metacarpal", "Third_metacarpal_bone", true);


		load('ctm/UL/left/metacarpals/L4.ctm', "Right 4th metacarpal", "Fourth_metacarpal_bone", true);


		load('ctm/UL/left/metacarpals/L5.ctm', "Right 5th metacarpal", "Fifth_metacarpal_bone", true);


		//Right phalanges

		load('ctm/UL/left/phalanges/1-1.ctm', "Pollex- Proximal Phalynx", "Phalanx_bone", true);
		load('ctm/UL/left/phalanges/1-2.ctm', "Pollex- Distal Phalynx", "Phalanx_bone", true);
		load('ctm/UL/left/phalanges/2-1.ctm', "Index- Proximal Phalynx", "Phalanx_bone", true);


		load('ctm/UL/left/phalanges/2-2.ctm', "Index- Middle Phalynx", "Phalanx_bone", true);
		load('ctm/UL/left/phalanges/2-3.ctm', "Index- Distal Phalynx", "Phalanx_bone", true);
		load('ctm/UL/left/phalanges/3-1.ctm', "Middle Finger- Proximal Phalynx", "Phalanx_bone", true);
		load('ctm/UL/left/phalanges/3-2.ctm', "Middle Finger- Middle Phalynx", "Phalanx_bone", true);
		load('ctm/UL/left/phalanges/3-3.ctm', "Middle Finger- Distal Phalynx", "Phalanx_bone", true);
		load('ctm/UL/left/phalanges/4-1.ctm', "Ring Finger- Proximal Phalynx", "Phalanx_bone", true);
		load('ctm/UL/left/phalanges/4-2.ctm', "Ring Finger- Middle Phalynx", "Phalanx_bone", true);
		load('ctm/UL/left/phalanges/4-3.ctm', "Ring Finger- Distal Phalynx", "Phalanx_bone", true);
		load('ctm/UL/left/phalanges/5-1.ctm', "Pinky Finger- Proximal Phalynx", "Phalanx_bone", true);
		load('ctm/UL/left/phalanges/5-2.ctm', "Pinky Finger- Middle Phalynx", "Phalanx_bone", true);
		load('ctm/UL/left/phalanges/5-3.ctm', "Pinky Finger- Distal Phalynx", "Phalanx_bone", true);

		//sternum
		load('ctm/Sternum.ctm', "Sternum", "Sternum");

		//legs
		load('ctm/LL/LeftOsInnominatum.ctm', "Left Os Innominatum", "Hip_bone");

		//mirror mesh
		load('ctm/LL/RightOsInnominatum.ctm', "Right Os Innominatum", "Hip_bone");
		load('ctm/LL/RightFemur.ctm', "Right Femur", "Femur");
		load('ctm/LL/LeftFemur.ctm', "Left Femur", "Femur");
		load('ctm/LL/RightTibia.ctm', "Right Tibia", "Tibia");

		load('ctm/LL/LeftTibia.ctm', "Left Tibia", "Tibia");
		load('ctm/LL/RightPatella.ctm', "Right Patella", "Patella");
		load('ctm/LL/LeftPatella.ctm', "Left Patella", "Patella");
		load('ctm/LL/ankle/Calcaneum.ctm', "Left Calcaneum", "Calcaneus");

		load('ctm/LL/ankle/Talus.ctm', "Left Talus", "Talus_bone");
		load('ctm/LL/ankle/Cuboid.ctm', "Left Cuboid", "Cuboid_bone");
		load('ctm/LL/ankle/Navicular.ctm', "Left Navicular", "Navicular_bone");
		load('ctm/LL/ankle/MedialCuneiform.ctm', "Left Medial Cuneiform", "Cuneiform_bones");
		load('ctm/LL/ankle/LateralCuneiform.ctm', "Left Lateral Cuneiform", "Cuneiform_bones");
		load('ctm/LL/ankle/IntermediateCuneiform.ctm', "Left Intermediate Cuneiform", "Cuneiform_bones");

		// reverse ankle joints
		load('ctm/LL/ankle/Calcaneum.ctm', "Right Calcaneum", "Calcaneus", true);

		load('ctm/LL/ankle/Talus.ctm', "Right Talus", "Talus_bone", true);
		load('ctm/LL/ankle/Cuboid.ctm', "Right Cuboid", "Cuboid_bone", true);
		load('ctm/LL/ankle/Navicular.ctm', "Right Navicular", "Navicular_bone", true);
		load('ctm/LL/ankle/MedialCuneiform.ctm', "Right Medial Cuneiform", "Cuneiform_bones", true);
		load('ctm/LL/ankle/LateralCuneiform.ctm', "Right Lateral Cuneiform", "Cuneiform_bones", true);
		load('ctm/LL/ankle/IntermediateCuneiform.ctm', "Right Intermediate Cuneiform", "Cuneiform_bones", true);

		//metatarsals
		load('ctm/LL/metatarsals/1.ctm', "1st Metatarsal", "First_metatarsal_bone");
		load('ctm/LL/metatarsals/2.ctm', "2nd Metatarsal", "Second_metatarsal_bone");
		load('ctm/LL/metatarsals/3.ctm', "3rd Metatarsal", "Third_metatarsal_bone");
		load('ctm/LL/metatarsals/4.ctm', "4th Metatarsal", "Fourth_metatarsal_bone");
		load('ctm/LL/metatarsals/5.ctm', "5th Metatarsal", "Fifth_metatarsal_bone");


		//reversed metatarsals
		load('ctm/LL/metatarsals/1.ctm', "1st Metatarsal", "First_metatarsal_bone", true);
		load('ctm/LL/metatarsals/2.ctm', "2nd Metatarsal", "Second_metatarsal_bone", true);
		load('ctm/LL/metatarsals/3.ctm', "3rd Metatarsal", "Third_metatarsal_bone", true);
		load('ctm/LL/metatarsals/4.ctm', "4th Metatarsal", "Fourth_metatarsal_bone", true);
		load('ctm/LL/metatarsals/5.ctm', "5th Metatarsal", "Fifth_metatarsal_bone", true);


		// Digits - left
		load('ctm/LL/phalanges/1-1.ctm', "Pollex Proximal Phalynx", "Phalanx_bone");
		load('ctm/LL/phalanges/1-2.ctm', "Pollex Distal Phalynx", "Phalanx_bone");
		load('ctm/LL/phalanges/2-1.ctm', "2nd Toe Proximal Phalynx", "Phalanx_bone");
		load('ctm/LL/phalanges/2-2.ctm', "2nd Toe Middle Phalynx", "Phalanx_bone");
		load('ctm/LL/phalanges/2-3.ctm', "2nd Toe Distal Phalynx", "Phalanx_bone");
		load('ctm/LL/phalanges/3-1.ctm', "3rd Toe Proximal Phalynx", "Phalanx_bone");
		load('ctm/LL/phalanges/3-2.ctm', "3rd Toe Middle Phalynx", "Phalanx_bone");
		load('ctm/LL/phalanges/3-3.ctm', "3rd Toe Distal Phalynx", "Phalanx_bone");
		load('ctm/LL/phalanges/4-1.ctm', "4th Toe Proximal Phalynx", "Phalanx_bone");
		load('ctm/LL/phalanges/4-2.ctm', "4th Toe Middle Phalynx", "Phalanx_bone");
		load('ctm/LL/phalanges/4-3.ctm', "4th Toe Distal Phalynx", "Phalanx_bone");
		load('ctm/LL/phalanges/5-1.ctm', "5th Toe Proximal Phalynx", "Phalanx_bone");
		load('ctm/LL/phalanges/5-2.ctm', "5th Toe Middle Phalynx", "Phalanx_bone");
		load('ctm/LL/phalanges/5-3.ctm', "5th Toe Distal Phalynx", "Phalanx_bone");


		//digits -right


		load('ctm/LL/phalanges/1-1.ctm', "Pollex Proximal Phalynx", "Phalanx_bone", true);
		load('ctm/LL/phalanges/1-2.ctm', "Pollex Distal Phalynx", "Phalanx_bone", true);
		load('ctm/LL/phalanges/2-1.ctm', "2nd Toe Proximal Phalynx", "Phalanx_bone", true);
		load('ctm/LL/phalanges/2-2.ctm', "2nd Toe Middle Phalynx", "Phalanx_bone", true);
		load('ctm/LL/phalanges/2-3.ctm', "2nd Toe Distal Phalynx", "Phalanx_bone", true);
		load('ctm/LL/phalanges/3-1.ctm', "3rd Toe Proximal Phalynx", "Phalanx_bone", true);
		load('ctm/LL/phalanges/3-2.ctm', "3rd Toe Middle Phalynx", "Phalanx_bone", true);
		load('ctm/LL/phalanges/3-3.ctm', "3rd Toe Distal Phalynx", "Phalanx_bone", true);
		load('ctm/LL/phalanges/4-1.ctm', "4th Toe Proximal Phalynx", "Phalanx_bone", true);
		load('ctm/LL/phalanges/4-2.ctm', "4th Toe Middle Phalynx", "Phalanx_bone", true);
		load('ctm/LL/phalanges/4-3.ctm', "4th Toe Distal Phalynx", "Phalanx_bone", true);
		load('ctm/LL/phalanges/5-1.ctm', "5th Toe Proximal Phalynx", "Phalanx_bone", true);
		load('ctm/LL/phalanges/5-2.ctm', "5th Toe Middle Phalynx", "Phalanx_bone", true);
		load('ctm/LL/phalanges/5-3.ctm', "5th Toe Distal Phalynx", "Phalanx_bone", true);

		//teeth
		load('ctm/teeth.ctm', "Teeth", "Human_tooth", true);


		renderer = new THREE.WebGLRenderer({
			alpha: true,
			preserveDrawingBuffer: true
		});
		renderer.setPixelRatio(window.devicePixelRatio);
		renderer.setSize(window.innerWidth, window.innerHeight);
		container.appendChild(renderer.domElement);


		//controls
		controls = new THREE.OrbitControls(camera, renderer.domElement);
		controls.rotateSpeed = 0.1;
		controls.enableDamping = true;
		controls.dampingFactor = 0.1;
		controls.minDistance = 50;
		controls.maxDistance = 1300;

		function space() {
			requestAnimationFrame(space);

			mesh.rotation.x += 0.0004;
			mesh.rotation.y += 0.0001;

		}

		space();

		function loadTexture(path) {
			const texture = new THREE.Texture(texture_placeholder);
			const material = new THREE.MeshBasicMaterial({
				map: texture,
				overdraw: 0.5
			});
			const image = new Image();
			image.onload = function () {
				texture.image = this;
				texture.needsUpdate = true;
			};
			image.src = path;
			return material;
		}

		window.addEventListener('resize', onWindowResize, false);

		// initialize object to perform world/screen calculations
		projector = new THREE.Projector();


		// when the mouse moves, call the given function
		document.addEventListener('click', onDocumentMouseClick, false);
	}

	function onDocumentMouseClick(event) {
		// the following line would stop any other event handler from firing
		// (such as the mouse's TrackballControls)
		//event.preventDefault();

		// update the mouse variable
		mouse.x = (event.clientX / target.offsetWidth) * 2 - 1;
		mouse.y = -(event.clientY / target.offsetHeight) * 2 + 1;

		// find intersections

		// create a Ray with origin at the mouse position
		//   and direction into the scene (camera direction)
		const vector = new THREE.Vector3(mouse.x, mouse.y, 1);
		vector.unproject(camera);
		const ray = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());

		// create an array containing all objects in the scene with which the ray intersects
		const intersects = ray.intersectObjects(scene.children);

		// INTERSECTED = the object in the scene currently closest to the camera
		//		and intersected by the Ray projected from the mouse position

		// if there is one (or more) intersections
		if (intersects.length > 0) {
			// if the closest object intersected is not the currently stored intersection object
			if (intersects[0].object !== INTERSECTED) {

				// restore previous intersection object (if it exists) to its original color
				if (INTERSECTED)
					INTERSECTED.material.color.setHex(INTERSECTED.currentHex);
				// store reference to closest object as current intersection object
				INTERSECTED = intersects[0].object;
				// store color of closest object (for later restoration)
				INTERSECTED.currentHex = INTERSECTED.material.color.getHex();
				// set a new color for closest object
				INTERSECTED.material.color.setHex(0xf44336);


				//tween
				if (INTERSECTED.userData.x) {
					const from = {
						x: cube.position.x,
						y: cube.position.y,
						z: cube.position.z
					};

					const to = {
						x: -INTERSECTED.userData.x,
						y: INTERSECTED.userData.y,
						z: INTERSECTED.userData.z
					};
					console.log(TWEEN.Easing);
					const tween = new TWEEN.Tween(from)
						.to(to, 2000)
						.easing(TWEEN.Easing.Sinusoidal.InOut)
						.onUpdate(function() {
							cube.position.set(from.x, from.y, from.z);
						}).start();

					animate();
					//If we register the callback animate, but the TWEEN.update(time) returns false,
					//cancel/unregister the handler
					function animate( time ) {
						var id = requestAnimationFrame(animate);
						var result = TWEEN.update(time);
						if(!result) cancelAnimationFrame(id);
					}

				}


				//replace
				document.getElementById("heading").innerHTML = INTERSECTED.name;

				document.getElementById("description").innerHTML = "";
				$('.loading').show();
				$('.results').hide();
				returnMyDesc(INTERSECTED.userData.link);
				// console.log(mesh.userData.name);

			}
		} else // there are no intersections
		{
			// restore previous intersection object (if it exists) to its original color
			if (INTERSECTED)
				INTERSECTED.material.color.setHex(INTERSECTED.currentHex);
			// remove previous intersection object reference
			//     by setting current intersection object to "nothing"
			INTERSECTED = null;

		}
	}


	function onWindowResize() {


		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();

		renderer.setSize(window.innerWidth, window.innerHeight);

	}

	function update() {


	}


	function animate() {
		requestAnimationFrame(animate);
		controls.update();
		render();
		update();
	}

	function render() {
		camera.lookAt(cube.position);

		renderer.setClearColor(0x212121, 1);
		renderer.render(scene, camera);


	}

	//wikipedia function
	function returnMyDesc(myLink) {
		const q = "http://en.wikipedia.com/" + myLink;
		function display(info) {


			let rawData = info.raw;
			const summaryInfo = info.summary;
			const properties = rawData[info.dbpediaUrl];

			for (let key in summaryInfo) {
				$('.summary .' + key).text(summaryInfo[key]);
			}
			$('.summary .thumbnail').attr('src', summaryInfo.image);
			const dataAsJson = JSON.stringify(summaryInfo, null, '    ');

			$('.loading').hide();
			$('.results').show();

		};
		console.log(WIKIPEDIA);
		WIKIPEDIA.getData(q, display, function (error) {
			alert(error);
		});
	}


	const button = document.getElementById('hide-btn');
	if (window.innerHeight > window.innerWidth) {
		document.getElementById('stuff').style.display = "none";
		button.innerHTML = "Show Information";
	}
	button.onclick = function () {
		const div = document.getElementById('stuff');
		if (div.style.display !== 'none') {
			div.style.display = 'none';
			button.innerHTML = "Show Information";
		} else {
			div.style.display = 'block';
			button.innerHTML = "Hide Information";
		}
	};
}

ReactDOM.render(<Skele/>, target);