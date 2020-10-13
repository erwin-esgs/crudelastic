
const pictureTab = document.getElementById('picture')
const webcamTab = document.getElementById('webcam')
const modelLocation = 'models';

function popup(flag){
	if(flag == 0){
		pictureTab.style.display = "block";
		webcamTab.style.display = "none";
		
		const imageUpload = document.getElementById('imageUpload')
		const imgcontainer = document.getElementById('imgcontainer') 
		const imgcontainerright = document.getElementById('imgcontainerright') 

		Promise.all([
			faceapi.nets.faceRecognitionNet.loadFromUri(modelLocation),
			faceapi.nets.faceLandmark68Net.loadFromUri(modelLocation),
			faceapi.nets.ssdMobilenetv1.loadFromUri(modelLocation),
			faceapi.nets.ageGenderNet.loadFromUri(modelLocation)
			
		]).then(start)

		async function start() {
		  document.getElementById('wait').innerHTML = "Select File"
		  imageUpload.style.display = "block"
		  
		  const container = document.createElement("div")
		  container.style.position = "relative";
		  container.style.justifyContent = "center";
		  container.style.flexDirection = "column";
		  container.style.display = "flex";
		  imgcontainer.append(container);
		  
		  let containerright  
		  let image 
		  let canvas 
		  
		  imageUpload.addEventListener( 'change' , async () => { 
			if (containerright) containerright.remove()
			containerright = document.createElement("div")
			containerright.style.position = "relative";
			containerright.style.justifyContent = "center";
			containerright.style.flexDirection = "column";
			//containerright.style.display = "flex";
			imgcontainerright.append(containerright);
			
			const response = loadAjax(); 
		  
			const labeledFaceDescriptors = await loadLabeledImages(response)
			
			//console.log(labeledFaceDescriptors)
			const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.55) 
			
			if (image) image.remove()
			
			if (canvas) canvas.remove()
			image = await faceapi.bufferToImage(imageUpload.files[0])  
			if( image.width > container.offsetWidth ){ 
				image.height =  container.offsetWidth / image.width * image.height; 
				image.width =  container.offsetWidth;
			} 
			
			container.append(image) 
			canvas = faceapi.createCanvasFromMedia(image) 
			container.append(canvas)
			
			const displaySize = { width: image.width, height: image.height }
			//console.log(displaySize)
			faceapi.matchDimensions(canvas, displaySize)
			const detections = await faceapi.detectAllFaces(image).withFaceLandmarks().withFaceDescriptors().withAgeAndGender()
			const resizedDetections = await faceapi.resizeResults(detections, displaySize)
			
			//console.log( response.rows ) 
			
			let i=0;
			const results = resizedDetections.map( (d) => {
				const fm = faceMatcher.findBestMatch(d.descriptor);
				const box = d.detection.box 
				
				
				let labelDetection = ""
				for( let j=0; j< response.rows.length; j++){
					if( fm.label.toString() == response.rows[j][0] ){
						labelDetection = response.rows[j][1]
						let image2 = new Image(); image2.src  = response.rows[j][2]
						
						image2.onload = function() {  
							if( image2.width > containerright.offsetWidth ){ 
								image2.height =  containerright.offsetWidth / image2.width * image2.height; 
								image2.width =  containerright.offsetWidth; 
							}  
						 containerright.append(image2)
						} 
					}
				} 
				
				const drawBox = new faceapi.draw.DrawBox(box, { label:  labelDetection  }) 
				
				const anchor = { x: box.x, y: box.y }
				const drawOptions = {
				  anchorPosition: 'TOP_LEFT',
				  backgroundColor: 'rgba(0, 0, 0, 0.5)'
				}
				const drawText = new faceapi.draw.DrawTextField( [ [" " + d.gender] , [" Age: " + Math.floor(d.age).toString()] ] , anchor , drawOptions)
				drawBox.draw(canvas) 
				drawText.draw(canvas) 
				
				i++
			})
			 
		  })
		}
		
	}else{
		pictureTab.style.display = "none";
		webcamTab.style.display = "block";
		
		const videocontainer = document.getElementById('videocontainer') 
		const videocontainerright = document.getElementById('videocontainerright') 
		
		Promise.all([
			faceapi.nets.tinyFaceDetector.loadFromUri(modelLocation),
			faceapi.nets.faceLandmark68Net.loadFromUri(modelLocation),
			faceapi.nets.faceRecognitionNet.loadFromUri(modelLocation),
			faceapi.nets.faceExpressionNet.loadFromUri(modelLocation),
			//faceapi.nets.ssdMobilenetv1.loadFromUri(modelLocation),
			faceapi.nets.ageGenderNet.loadFromUri(modelLocation)
		]).then(init)

		const video = document.getElementById('video');   
		//config video
			const constraints = {
			audio: true,
			video:{
				//width: 1024, height: 600
				width : videocontainer.offsetWidth*0.97 , height:  600
			}
		};
	//access webcam
	async function init(){
		try{
			const stream = await navigator.mediaDevices.getUserMedia(constraints);
			video.srcObject = stream;
			
			video.addEventListener('play', () => {
				const canvas = faceapi.createCanvasFromMedia(video)
				videocontainer.append(canvas)
				const displaySize = {width: constraints.video.width , height: constraints.video.height}
				faceapi.matchDimensions(canvas, displaySize)
				
				let flag=0; let a=0;
				setInterval( async () => {
						const detection = await faceapi.detectAllFaces(video,
						new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions()
						
						if(detection != '' && flag==0){
							console.log(a); a++; 
							const resizedDetection = faceapi.resizeResults(detection , displaySize)
							canvas.getContext('2d').clearRect(0,0,canvas.width , canvas.height )
							faceapi.draw.drawDetections(canvas, resizedDetection)
							faceapi.draw.drawFaceLandmarks(canvas, resizedDetection)
							flag=0
						}
						
						
					}, 1000)
			})
			
		}catch(e){
			console.log(`navigator.getUserMedia.error:${e.toString()}`);
		}
	}
	
	}
}



function loadLabeledImages(response) {   
  
  return Promise.all( 
    response.rows.map(async label => { 
		 const descriptions = []  
		 //console.log(label);
			const img = new Image(); img.src = label[2];
			const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
			//console.log(detections.descriptor)
			descriptions.push(detections.descriptor)
		 
      return new faceapi.LabeledFaceDescriptors( label[0] , descriptions) 
    }) 
  )
}

function loadAjax( ) { 
const url = "http://192.168.13.182:9201/";
	var settings = {
		  "url": url+"_sql?format=json",
		  "type": "POST",
		  "timeout": 0,
		  "headers": {
			"Content-Type": "application/json"
		  },
		  "async": false,
		  //""data": JSON.stringify({"query":"SELECT two, three FROM testerwin WHERE one='"+label+"' ","fetch_size":10}),
		  "data": JSON.stringify({"query":"SELECT one, two, three FROM testerwin  ","fetch_size":100}),
		};

	let result = "";
	$.ajax(settings).done(function (response) { 
			 result = response;
	}); 
	//console.log( result );
	return result;
}
 