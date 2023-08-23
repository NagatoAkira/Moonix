canvas = document.querySelector("canvas")
ctx = canvas.getContext('2d')

function defineCanvas(){
	canvas.height = window.innerHeight
	canvas.width = window.innerWidth
}

defineCanvas()

function game_update(){
	ctx.fillStyle = "#000000"
	ctx.fillRect(0,0,canvas.width, canvas.height)
}

function distFunc(x1,y1,x2,y2){
	let vector = [x2-x1, y2-y1]
	return Math.sqrt(vector[0]**2+vector[1]**2)
}

function convertPositionToString(x,y){
	return x.toString()+','+y.toString()
}

function splitWord(string, sign){
	let splitList = []
	let word = ''	
	for(let s in string){
		s = string[s]

		if(s == sign){
			splitList.push(word)
			word = ''
			continue
		}
		word += s
	}
	splitList.push(word)
	return splitList
}

function clearUndefined(list){
	let cleared = []
	for(let l in list){
		if(list[l]!=null){
			cleared[l] = list[l]
		}
	}
	return cleared
}
function getSign(numb){
	if(numb > 0){
		return 1
	}
	if(numb < 0){
		return -1
	}
	if(numb == 0){
		return 0
	}
}

function randInt(num01,num02){
	return Math.floor(Math.random()*(num02-num01))+num01
}

class SandSimulation{
	constructor(){
		this.size = {block: (canvas.width*canvas.height)**0.5/250, 
					 square: 9}


		this.center = {x: canvas.width/2, y: canvas.height/2-this.size.block*10}
		this.x = this.center.x
		this.y = this.center.y
		this.velocity = {x:0,y:1}
		this.speed = 3


		this.figure = {active:[], list:[], x:0, y:0, color:0, stop: false, body: null}
		this.apply = []

		this.deletedColorList = []
		this.deleteTimer = fps/5

		this.gameArea = {x: -45, y: -9*16/2, w:9*9, h:9*16}

		this.colors = {default: ['#e35d3b', '#d5db2c','#50e046'], 
					   dark: ['#9c3319','#9fa31a','#248f1d'], 
					   light:['#fa9a82','#f4fa50','#75fa6b']}

		this.doSpawn = true
		this.isBoom = false
		this.isGameOver = false
		
		this.score = 0
		this.color = randInt(0,3)

		this.arrowPosofBlock = {x:canvas.width/2+10, y:this.size.block*5, size:{w:this.size.block*13,h:this.size.block*13}, sprite: new Image()}
		this.arrowPosofBlock.sprite.src = "assets\\arrow.svg"
		this.corner = {sprite:new Image}
		this.corner.sprite.src = 'assets\\corner.svg'
		this.canvas = {sprite:new Image}
		this.canvas.sprite.src = 'assets\\canvas.svg'

	}
	spawnFigure(){
		if(this.doSpawn){
		let game = this.gameArea
		this.buildFigure(randInt(game.x/3+1, (game.x+game.w)/3-4)*3,-9*16/2, this.color)
		this.color = randInt(0,3)
		this.doSpawn = false
		}
	}
	buildFigure(x,y,color){
		let plusORminus = Math.random()>0.5 ? 1:-1

		let L = [0, 180, 180+plusORminus*45]
		let S = [0, 90, 45]
		let P = [0,180,90]
		let I = [[{x:3,y:0},{x:3,y:1},{x:3,y:2},{x:3,y:3}],
				 [{x:1,y:1},{x:2,y:1},{x:3,y:1},{x:4,y:1}]]

		this.figureDeg = [L,S,P,I][randInt(0,4)]
		this.figureDegIndex = 0

		let figure = this.figure
		figure.x = x
		figure.y = y
		figure.color = color

		this.rotateFigure()
	}
	rotateFigure(){
		if(this.figureDeg!=null && !this.figure.stop){


		let body = randInt(0,20)==0 ? 'solid':'soft'

		if(this.figure.body != null){
		body = this.figure.body
		}
		this.figure.body = body


		let form = this.figureDeg
		if(typeof(this.figureDeg[0]) == 'number'){

			for(let f in form){
				form[f] += 90
			}
	
			form = this.convertDegToFig(form)
		}else{
			this.figureDegIndex += 1
			form = this.figureDeg[this.figureDegIndex%2]
		}
		let figure = []
		let size = this.size.block
		let game = this.gameArea
		let convert = convertPositionToString

		let x = this.figure.x
		let y = this.figure.y
		let color = this.figure.color


		for(let f in form){
			f = form[f]
			let xo = x+1+f.x*3 
			let yo = y+1+f.y*3 
				for(let xl = xo-1; xl<xo+2; xl++){
					for(let yl = yo-1; yl<yo+2; yl++){
						if(xl >= game.x && xl <= game.x+game.w+1 && yl <= game.y+game.h-1){
							figure[convert(xl,yl)] = {x:xl*size+this.x, y:yl*size+this.y, color:color, body:body}
						}else{
							return null
						}
					}
				}
		}
		this.figure.active = figure
		}
	}
	collisionActiveList(){
		let convert = convertPositionToString
		for(let f in this.figure.active){
			let spl = splitWord(f,',')
			let i = {x:parseInt(spl[0]), y: parseInt(spl[1])}
			if(this.isBlockExist(convert(i.x, i.y+1), this.apply) || 
			   this.isBlockExist(convert(i.x+1, i.y), this.apply) ||
			   this.isBlockExist(convert(i.x-1, i.y), this.apply)){
				this.figure.stop = true
				return true
			}
		}
		return false
	}
	convertDegToFig(form){
		let newform = []
		for(let f in form){
			f = form[f]

			let sin = getSign(Math.sin(Math.PI/180*f).toFixed(1))+1
			let cos = getSign(Math.cos(Math.PI/180*f).toFixed(1))+1

			newform.push({x:sin,y:cos})

		}
		newform.push({x:1,y:1})
		return newform
	}
	moveFigure(){
		let game = this.gameArea
		let figure = this.figure.active
		let size = this.size.block
		let convert = convertPositionToString
		let stop = false

		if(this.collisionActiveList()){
			return null
		}
		
		for(let xo=game.x; xo<game.x+game.w; xo++){
			if(this.isBlockExist(convert(xo,game.y+game.h-1),figure)){
				stop = true
				this.figure.stop = true
				break
			}
		}
		if(!stop){
		let xo = this.velocity.x * this.speed
		let yo = this.velocity.y 
		let newfig = []
		for(let f in figure){
			let bl = figure[f]
			let spl = splitWord(f,',')
			let i = {x: parseInt(spl[0]), y: parseInt(spl[1])}

			if(i.x+xo < game.x || i.x+xo > game.x+game.w){
				stop = true
				newfig = []
				break
			}

			newfig[convert(i.x+xo, i.y)] = {x:bl.x+xo*size, y:bl.y, color:bl.color, body:bl.body} 
		}

		if(!stop){
		this.figure.active = newfig
		figure = this.figure.active
		newfig = []
		this.figure.x += xo
		}

		for(let f in figure){
			let bl = figure[f]
			let spl = splitWord(f,',')
			let i = {x: parseInt(spl[0]), y: parseInt(spl[1])}

			if(yo+i.y < game.y+game.h-1 && this.apply[convert(i.x, yo+i.y)] == null){
				newfig[convert(i.x, i.y+yo)] = {x:bl.x, y:bl.y+yo*size, color:bl.color, body:bl.body}
			}else{
				newfig = []
				for(let f in figure){
					let bl = figure[f]
					let spl = splitWord(f,',')
					let i = {x: parseInt(spl[0]), y: parseInt(spl[1])}
					newfig[convert(i.x, i.y+1)] = {x:bl.x, y:bl.y+size, color:bl.color, body:bl.body}
				}
				break
			}
		}
		
		this.figure.active = newfig
		this.figure.y += yo
		}
	}
	isBlockExist(pos,list){
		return list[pos] != null
	}
	defineBlock(pos,value,list){
		list[pos] = value
	}
	deleteBlock(pos,list){
		delete list[pos]
	}
	simulationProcess(){
		let figure = this.figure.list
		let apply = this.apply
		let size = this.size.block
		let convert = convertPositionToString
		let game = this.gameArea

		let output = false 

		for(let f in figure){
			let bl = figure[f]

			let spl = splitWord(f, ',')
			let i = {x: parseInt(spl[0]), y: parseInt(spl[1])}

			let areaState = i.y < game.y+game.h-1.5 && i.y > game.y && 
							    i.x < game.x+game.w && i.x > game.x-1

			if(this.isBlockExist(f,figure) && areaState){

			let conv = {r:convert(i.x+1, i.y+1), l: convert(i.x-1, i.y+1), d: convert(i.x,i.y+1), u: convert(i.x,i.y-1)}

				if(!this.isBlockExist(conv.d,figure) && !this.isBlockExist(conv.d,apply)){
					figure[conv.d] = {x:bl.x, y: bl.y+size, color:bl.color, body:bl.body}
					this.deleteBlock(f,figure)
					output = true
					continue
				}
				if(this.isBlockExist(conv.d,figure) && this.isBlockExist(conv.u,figure) ||
				   this.isBlockExist(conv.d,apply) && this.isBlockExist(conv.u,apply)){
					if(!this.isBlockExist(conv.r,figure) && !this.isBlockExist(conv.l,figure) &&
					   !this.isBlockExist(conv.r,apply) && !this.isBlockExist(conv.l,apply)){
						if(Math.random()<0.5){
							figure[conv.r] = {x:bl.x+size, y: bl.y+size, color:bl.color, body:bl.body}
						}else{
							figure[conv.l] = {x:bl.x-size, y: bl.y+size, color:bl.color, body:bl.body}
						}
						this.deleteBlock(f,figure)	
						output = true
						continue
					}
					if(!this.isBlockExist(conv.r,figure) && !this.isBlockExist(conv.r,apply)){
						figure[conv.r] = {x:bl.x+size, y: bl.y+size, color:bl.color, body:bl.body}
						this.deleteBlock(f,figure)	
						output = true
				}
					if(!this.isBlockExist(conv.l,figure) && !this.isBlockExist(conv.l,apply)){
						figure[conv.l] = {x:bl.x-size, y: bl.y+size, color:bl.color, body:bl.body}
						this.deleteBlock(f,figure)
						output = true
				}
				}
			}
		}
		this.figure.list = clearUndefined(figure)
		return output
	}
	applyFigure(){
		if(this.figure.stop){
			for(let f in this.figure.active){
				let fo = this.figure.active[f]
				if(fo!=null){
					if(parseInt(splitWord(f,',')[1]) < this.gameArea.y+5){
						this.isGameOver = true
					}
					if(fo.body == 'soft'){
					this.figure.list[f] = fo
					}
					if(fo.body == 'solid'){
					this.apply[f] = fo
					}
				}
			}

			this.figure.active = []
			this.figure.body = null
			this.figure.stop = false
			this.doSpawn = true
		}

		if(this.figure.list!=[] && !this.simulationProcess()){
			this.doWait = true
			for(let f in this.figure.list){
				let fo = this.figure.list[f]
				if(fo!=null){
					this.apply[f] = (fo)
				}
			}
			this.figure.list = []
		}
	}
	
	checkFade(list,x,y,color){

		let funcs = {convert: convertPositionToString, isBlockExist:this.isBlockExist}
		let output = {}

		function distributeCheck(list,x,y,funcs,output){

			for(let xo=x-1; xo<x+2; xo++){
				for(let yo=y-1; yo<y+2; yo++){
					let conv = funcs.convert(xo,yo)
					if (funcs.isBlockExist(conv,list)){
						if(list[conv].color == color && output[conv]==null){
							output[conv] = {x:xo, y:yo}
							distributeCheck(list,xo,yo,funcs,output)
						}
					}
				}
			}

			return output

			
		}

		

		return distributeCheck(list,x,y,funcs,output)
	}

	findFade(color){
		let game = this.gameArea
		let convert = convertPositionToString

		for(let y=game.y; y<game.y+game.h; y++){

			let check = this.checkFade(this.apply,game.x,y,color)
			for(let x in check){
				x = check[x].x
				if(x == game.x+game.w-1){
					return check
				}
			}
		}

		return null
	}
	executeFade(){
		let doBack = false
		for(let col in this.colors.default){
			let listFade = this.findFade(col)
			for(let pos in listFade){
				if(this.isBoom){
				this.score += 1
				delete this.apply[pos]
				}else{
					this.isBoom = true
					this.deletedColorList = listFade
					return null
				}
				doBack = true
			}
		}

		if(this.isBoom){
			console.log(this.score)
			this.deletedColorList = []
			this.isBoom = false
		}

		this.apply = clearUndefined(this.apply)

		this.doBack(doBack)
	}
	doBack(state){
		if(state){
		for(let a in this.apply){
			this.figure.list[a] = this.apply[a]
		}
		this.apply = []
		}
	}
	isTimerOverForBoom(){
		if(this.deleteTimer <= 0){
			this.deleteTimer = fps/5
			return true
		}
		if(this.isBoom){
			this.deleteTimer -= 1
		}
		return false
	}
	drawFigure(){
		let size = this.size.block+1

		for(let a in this.apply){
			let f = this.apply[a]
			
			if(f!=null){
				if(f.body == 'soft'){
				ctx.fillStyle = this.colors.default[f.color]
				}
				if(f.body == 'solid'){
				ctx.fillStyle = this.colors.dark[f.color]
				}
				ctx.fillRect(f.x, f.y, size, size)

				}
		}
		
		for(let f in this.figure.list){
			f = this.figure.list[f]
			if(f!=null){
				if(f.body == 'soft'){
				ctx.fillStyle = this.colors.default[f.color]
				}
				if(f.body == 'solid'){
				ctx.fillStyle = this.colors.dark[f.color]
				}
				ctx.fillRect(f.x, f.y, size, size)
			}
		}
		for(let f in this.figure.active){
			f = this.figure.active[f]
			if(f!=null){
				if(f.body == 'soft'){
				ctx.fillStyle = this.colors.default[f.color]
				}
				if(f.body == 'solid'){
				ctx.fillStyle = this.colors.dark[f.color]
				}
				ctx.fillRect(f.x, f.y, size, size)
			}
		}

		for(let f in this.deletedColorList){
			f = this.apply[f]
			if(f!=null){
				ctx.fillStyle = this.colors.light[f.color]
				ctx.fillRect(f.x, f.y, size, size)
			}
		}
	}

	drawBox(){
		let game = this.gameArea
		let size = this.size.block

		ctx.fillStyle = '#222034'
		ctx.fillRect(game.x*size+this.x, (game.y+2)*size+this.y, game.w*size+1, game.h*size+1)
	}

	drawArrow(){
		let arrow = this.arrowPosofBlock
		let size = this.size.block
		let game = this.gameArea

		ctx.fillStyle = '#e2e2e2'
		ctx.drawImage(arrow.sprite, arrow.x+this.figure.x*size+size*0.75-arrow.size.w/2,
									this.y-size*(game.w-5), arrow.size.w, arrow.size.h)

		ctx.save()
		ctx.translate(arrow.x+this.figure.x*size,this.y+size*(game.w+20))
		ctx.rotate(Math.PI)
		ctx.drawImage(arrow.sprite, arrow.size.w/2-size*0.75,arrow.size.h/2-size*0.75, arrow.size.w*-1, arrow.size.h)
		ctx.restore()

	}

	drawCorners(){
		let corner = this.corner
		let game = this.gameArea
		let block = this.size.block
		ctx.drawImage(corner.sprite, this.x+(game.x-18)*block, this.y+(game.y-2)*block, block*15, block*15)
		ctx.drawImage(corner.sprite, this.x+(game.x+game.w+5)*block, this.y+(game.y-2)*block, block*15, block*15)
		ctx.drawImage(corner.sprite, this.x+(game.x-18)*block, this.y+(game.y+game.h+7)*block, block*15, block*15)
		ctx.drawImage(corner.sprite, this.x+(game.x+game.w+5)*block, this.y+(game.y+game.h+7)*block, block*15, block*15)
	}

	drawCanvas(){
		let canva = this.canvas
		let size = this.size.block
		let game = this.gameArea

		ctx.drawImage(canva.sprite, this.x+(game.x-15.25)*size, this.y+(game.y+2)*size, size*14*8.05, size*20*8)
	}

	drawCurrentColor(){
		let size = this.size.block

		ctx.fillStyle = this.colors.dark[this.color]
		ctx.fillRect(this.x + size*90, this.y, size*15, size*15)
		ctx.fillStyle = this.colors.default[this.color]
		ctx.fillRect(this.x + size*93, this.y + size*3, size*9, size*9)
	}

	drawScore(){
		let size = this.size.block
		
		ctx.font = (size*10).toString()+'px Pixel'
		ctx.fillStyle = '#222034'
		ctx.fillText(Math.floor(this.score/10).toString().padStart(7,'0'), this.x+size*76, this.y+size*35)
	}

	draw(){
		this.drawBox()
		this.drawFigure()
		this.drawCanvas()
		this.drawCorners()
		this.drawArrow()
	}
	update(){
		this.draw()
		
		this.spawnFigure()
		this.moveFigure()
		this.applyFigure()
		if(!this.isBoom || this.isTimerOverForBoom()){
		this.executeFade()
		}
	}
}


class Decoration{
	constructor(img,x,y,scale){
		this.pixel =  (canvas.width*canvas.height)**0.5/250
		this.scale = scale * this.pixel
		this.x = x*this.pixel+canvas.width/2
		this.y = y*this.pixel+canvas.height/2
		this.image = new Image()
		this.image.src = img
		
	}
	draw(){
		ctx.drawImage(this.image,this.x,this.y,this.scale,this.scale)
	}
}
const fps = 60

var sand = new SandSimulation()
var colorShow = new Decoration('assets\\colorShow.svg',60,-30,75)
var background = new Decoration('assets\\background.png',-200,-250,400)

function animate(){
	setTimeout(()=>{
	window.requestAnimationFrame(animate)
	}, 1000/fps)

	defineCanvas()

	game_update()

	ctx.globalAlpha = 0.6
	background.draw()
	ctx.globalAlpha = 1

	sand.update()
	colorShow.draw()
	sand.drawCurrentColor()
	sand.drawScore()

	if(sand.isGameOver){
		sand = new SandSimulation()
		colorShow = new Decoration('assets\\colorShow.svg',60,-30,75)
		background = new Decoration('assets\\background.png',-200,-250,400)
	}
	
}

var map = {}

const coef = Math.trunc(40/fps+1)
onkeydown =  function(event){	

   
   map[event.code] = event.type == 'keydown'
   if(map['ArrowLeft']){
   	sand.velocity.x = -coef
   }
   if(map['ArrowRight']){
   	sand.velocity.x = coef
   }
   if(map['ArrowUp']){
   	sand.rotateFigure()
   }
   if(map['ArrowDown']){
   	sand.velocity.y = 3
   }
	
}

onkeyup = function(event){
	sand.velocity = {x:0, y:1}
	map = {}
}

window.addEventListener('resize', function(event){
	sand = new SandSimulation()
	colorShow = new Decoration('assets\\colorShow.svg',60,-30,75)
	background = new Decoration('assets\\background.png',-200,-250,400)
})

animate()