(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

var Util = require('../core/Util.js');


function Dot(options){
	if(!options || !options.context){
		return {};
	}

	this.context = options.context;
	this.entity = options.entity;
	this.style = options.style;
}

Dot.prototype = {

	constructor: Dot,

	position: null, //{x,y} screen coordinate system, pix

	style: null,

	draw: function(){
		this.context.drawImage(this.entity, this.position.x, this.position.y);
	},

	//中心点所在位置
	getCenterPosition: function(){
		var r = this.style.radius;
		if(this.position){
			return {x: this.position.x + r, y: this.position.y + r};
		}
		return null;
	},

	//左上所在位置
	setPosition: function(x, y){
		var r = this.style.radius;
		this.position = {x:x- r, y:y- r};
	}
};

module.exports = Dot;


},{"../core/Util.js":20}],2:[function(require,module,exports){
var geo = require('../core/geo.js');
var Rect = require('./Rect.js');

function DotSpatialIndex(option){

	this.maxCount  = option.maxCount || 200;
	this.splits = option.splits || 0;

	this.setData(option.data);

}

DotSpatialIndex.prototype = {

	constructor: DotSpatialIndex,

	query: function(bounds){
		return this.getPointsInBounds(bounds, this.indexes);
	},

	setData: function(data){

		var s = Date.now();

		var areaBounds = this.createBoundsOfPoints(data);

		// console.info(this.splits , Math.pow(data.length/this.maxCount, 0.5), this.splits || Math.max(~~Math.pow(data.length/this.maxCount, 0.5), 2));
		this.indexes = this.createGridTreeIndexes(data, areaBounds, this.splits || Math.max(~~Math.pow(data.length/this.maxCount, 0.5), 2));
		// this.indexes = this.createGridIndexes(data, areaBounds, this.splits);
		// this.indexes = this.createTreeIndexes(data, areaBounds);
	
		// console.info('create '+this.indexes.length+' indexes cost time:', Date.now()-s);
	},

	//查询在指定bounds里的点
	getPointsInBounds: function(bounds, indexes){
		var result = [],
			index
		;

		for(var i in indexes){

			index = indexes[i];

			if(geo.boundsCrossBounds(bounds, index.bounds)){
				
				//返回index集合
				result.push(index);

				//返回Dot集合
				// Array.prototype.push.apply(result, index.shapes);
			}
		}

		return result;
	},

	createTreeIndexes: function(points, bounds){
		var indexes = [];
		var self = this;
		var maxCount = this.maxCount;

		function buildIndexes(bounds){
			var hasProperPoints = self.isPointsCountInBoundsLessThan(points, bounds, maxCount);
			if(hasProperPoints.status === 0){
				indexes.push({
					bounds: bounds,
					shapes: hasProperPoints.points
				});
			}else if(hasProperPoints.status === 1){
				var subBounds = self.splitBounds(bounds);

				for(var i=0, b; b = subBounds[i++];){
					buildIndexes(b);
				}
			}
		};

		var s = Date.now();
		buildIndexes(bounds);

		//console.info('create '+indexes.length+' indexes cost '+(Date.now()-s) + ' ms');

		return indexes;
	},


	/**
	 * status: 
	 * 		1：点太多，需要继续分割
	 		0：点不多，可以保留
	 		-1：没有点，弃用
	 */
	isPointsCountInBoundsLessThan: function(points, bounds, maxCount){
		var pointsInBounds = [],
			count = 0
		;

		for(var i = 0, point; point = points[i++];){
			if(geo.latlngInBounds(point, bounds)){
				pointsInBounds.push(point);
				count ++ ;
				if(count > maxCount){
					return {status: 1};
				}
			}
		}


		if(pointsInBounds.length>0){
			return {status: 0, points: pointsInBounds};
		}else{
			
			return {status: -1};
		}

	},


	splitBounds: function(bounds){
		var min = bounds.min,
			max = bounds.max,
			center = {lat: (min.lat + max.lat)/2, lng: (min.lng + max.lng)/2}
		;

		return [
			// left top
			{min: {lat: center.lat, lng: min.lng}, max: {lat: max.lat, lng: center.lng}}, 
			// right top
			{min: {lat: center.lat, lng: center.lng}, max: {lat: max.lat, lng: max.lng}},
			// left bottom
			{min: {lat: min.lat, lng: min.lng}, max: {lat: center.lat, lng: center.lng}},
			// right bottom
			{min: {lat: min.lat, lng: center.lng}, max: {lat: center.lat, lng: max.lng}}

		];
	},

	createGridTreeIndexes: function(points, bounds, splits){

		var s = Date.now();

		var indexes = this.createIndexesByBounds(points, bounds, splits);
		var maxCount = this.maxCount;
		var list;
		var size = 0;
		var minSplits = 2;
		var splits;

		for(var i = 0, indexObj; indexObj = indexes[i++];){
			size = indexObj.shapes.length;

			if(size > maxCount){
				splits = Math.max(minSplits, ~~(Math.pow(size/maxCount, 0.5)));
				list = this.createIndexesByBounds(indexObj.shapes, indexObj.bounds, splits);
				list.unshift(i-1, 1);
				Array.prototype.splice.apply(indexes, list);
			}
		}


		return indexes;
	},


	/**
	 * 创建索引对象（区块），并确定每个索引区块中包含的点对象。
	 */
	createIndexesByBounds: function(points, bounds, splits){

		var min = bounds.min,
			max = bounds.max
		;

		var delta = {
			lat: (max.lat - min.lat)/ splits,
			lng: (max.lng - min.lng)/ splits
		};
		
		var baseIndexes = {},
			indexes = {},
			key
		;

		for(var y =0; y< splits; y++){
			for(var x =0; x< splits; x++){
				baseIndexes[x+'_'+y] = {

					shapes: [],

					bounds: {
						min: {
							lat: min.lat + delta.lat * y,
							lng: min.lng + delta.lng * x
						},
						max: {
							lat: min.lat + delta.lat * (y + 1),
							lng: min.lng + delta.lng * (x + 1)
						}
					}
				}
			}
		}


		for(var i = 0, point; point = points[i++];){

			key = this.getIndexKeyOfPoints(point, bounds, splits);

			if(!(key in indexes)){
				indexes[key] = baseIndexes[key];
			}

			indexes[key].shapes.push(point);

		}

		var list = [];

		for(var i in indexes){
			list.push(indexes[i]);
		}

		baseIndexes = null; //释放内存
		indexes = null;
		
		return list;
	},

	/**
	 * 计算一个点坐标属于的索引的编号
	 */
	getIndexKeyOfPoints: function (point, bounds, splits){
		var x = Math.min(~~((point.lng - bounds.min.lng)/(bounds.max.lng - bounds.min.lng) * splits),  splits-1);
		var y = Math.min(~~((point.lat - bounds.min.lat)/(bounds.max.lat - bounds.min.lat) * splits),  splits-1);

		return x + '_' + y;
	},

	/**
	 * 创建索引对象（区块），并确定每个索引区块中包含的点对象。
	 */
	createGridIndexes: function(points, bounds, splits){
		var s = Date.now();

		var min = bounds.min,
			max = bounds.max
		;

		var delta = {
			lat: (max.lat - min.lat)/ splits,
			lng: (max.lng - min.lng)/ splits
		};
		
		var baseIndexes = {},
			indexes = {},
			key
		;

		for(var y =0; y< splits; y++){
			for(var x =0; x< splits; x++){
				baseIndexes[x+'_'+y] = {

					shapes: [],

					bounds: {
						min: {
							lat: min.lat + delta.lat * y,
							lng: min.lng + delta.lng * x
						},
						max: {
							lat: min.lat + delta.lat * (y + 1),
							lng: min.lng + delta.lng * (x + 1)
						}
					}
				}
			}
		}


		var indexSize = 0;

		for(var i = 0, point; point = points[i++];){

			key = this.getIndexKeyOfPoints(point, bounds, splits);

			if(!(key in indexes)){
				indexes[key] = baseIndexes[key];
				indexSize++;
			}

			indexes[key].shapes.push(point);

		}

		baseIndexes = null; //释放内存

		// console.info('create '+indexSize+' indexes cost '+(Date.now()-s) + ' ms');

		return indexes;
	},

	createBoundsOfPoints: function(points){
		var min = {lat: 90, lng: 180},
			max = {lat: 0 , lng: 0}
		;
		
		var s = Date.now();

		for(var i = 0, point; point = points[i++];){
			min.lng = Math.min(point.lng, min.lng);
			max.lng = Math.max(point.lng, max.lng);
			min.lat = Math.min(point.lat, min.lat);
			max.lat = Math.max(point.lat, max.lat);
		}

		return {min: min, max: max};
	}
}

module.exports = DotSpatialIndex;
},{"../core/geo.js":21,"./Rect.js":3}],3:[function(require,module,exports){

var Util = require('../core/Util.js');


function Rect(options){
	if(!options || !options.context){
		return {};
	}

	this.context = options.context;
	this.bounds = options.bounds;

}

Rect.prototype = {

	constructor: Rect,

	position: null, //{x,y} screen coordinate system, pix

	style: null,

	draw: function(){
		var context = this.context,
			b = this.bounds
		;

		context.beginPath();
		context.rect(b.x, b.y, b.w, b.h);
		context.lineWidth = 2;
		context.strokeStyle = 'rgba(255, 55, 0, 1)';
		context.stroke();
	}
};

module.exports = Rect;


},{"../core/Util.js":20}],4:[function(require,module,exports){
var Util = require('../core/Util.js');
var geo = require('../core/geo.js');
var DotSpatialIndex = require('./DotSpatialIndex.js');
var Animation = require('../core/Animation.js');
var Dot = require('./Dot.js');
var Rect = require('./Rect.js');


var defaultStyle = {
	fillColor: 'rgba(220, 220, 0, 0.8)',
	strokeColor: 'rgba(220, 0, 0, 0.8)',
	strokeWidth: 1,
	radius: 10
}


function Dots(option){
    if(!option){
        return;
    }

    Animation.call(this, option);


    this.style = Util.extend({}, defaultStyle, option.style); 

    this.attributes = option.attributes || {};

    //按某个属性分组
    this.groupBy = option.groupBy || null;

    if(this.groupBy && option.groupStyles){
    	var groupStyles = option.groupStyles;
    	for(var i in groupStyles){
    		groupStyles[i] = Util.extend({}, defaultStyle, groupStyles[i]);
    	}

    	this.groupStyles = groupStyles;
    }

	this.entityDots = createEntity(this.style, this.groupStyles);

	this.onClick = option.onClick;

	this.maxCount = option.maxCount || 100;
	this.splits = option.splits || 0;
	this.debug = option.debug || false;
    
    this.visible = true;
};

Dots.prototype = new Animation();

Dots.prototype.construct = Dots;

Dots.prototype.init = function(){
	var clickHandler = this.onClick;

	if(clickHandler){
		qq.maps.event.addListener(this.map, 'click', function(e){
			// var data = this.data;
			var data = this.getDotsInCurrentBounds();

			if(!data || !this.visible){
				return;
			}

			var dist, minDist = 1000, buffer = 10, i = 0, l = data.length;
			var ePos = e.pixel, dotPos, d, dot;
			var nearest;

			do{
				d = data[i];
				dot = d.dot;

				if(dot){
					dotPos = dot.getCenterPosition();
					if(dotPos){
						dist = Math.sqrt((ePos.x-dotPos.x)*(ePos.x-dotPos.x)+(ePos.y-dotPos.y)*(ePos.y-dotPos.y));
						if(dist < minDist){
							minDist = dist;
							nearest = d;
						}
					}
				}

				i++;
			}while(i<l);

			var evt = null;

			if(nearest && minDist < buffer){
				var proj = this.getProjection();
				var ePixel = proj.fromLatLngToContainerPixel(e.latLng);
				var dotPixel = proj.fromLatLngToContainerPixel(new qq.maps.LatLng(Number(nearest.lat), Number(nearest.lng)));
				var checkedDist = Math.sqrt( (ePixel.x - dotPixel.x)*(ePixel.x - dotPixel.x) + (ePixel.y - dotPixel.y)*(ePixel.y - dotPixel.y) );

				//有时用xy验证距离会有误判，距离点击位置很远的点也会命中，为防止此类bug，再使用经纬度验证一次命中点和click位置的距离
				if(checkedDist < buffer){
					evt = {
						id: nearest.id,
						lat: nearest.lat,
						lng: nearest.lng
					}
				}else{
					console.info(checkedDist);
				}
			}

			clickHandler(evt);		
			return;
		}.bind(this));
	}	
};

Dots.prototype.buildDataAndShapes = function(data){
	this.spatialIndex = new DotSpatialIndex({
		data: data,
		maxCount: this.maxCount,
		splits: this.splits
	});

    this.data = data;
    this.createShapes(data);
    this.viewChangeHandler();
    this.scene.render();
};

Dots.prototype.createShapes = function(data){
	var ctx = this.context, 
		groupBy = this.groupBy,
		entityDots = this.entityDots,
		groupStyles = this.groupStyles,
		isGroup = !!(entityDots && groupStyles),
		shapes = [], 
		style,
		entity,
		d,
		groupKey;

	var s = Date.now();

	for(var i in data){	
		d = data[i];

		style = isGroup? (groupStyles[d[groupBy]] || this.style): this.style;
		entity = isGroup? (entityDots[d[groupBy]] || entityDots['default']): entityDots['default'];

		d.dot = new Dot({
			context: ctx,
			style: style,
			entity: entity
		});

		d.latlng = new qq.maps.LatLng(d.lat, d.lng);

		shapes.push(d.dot);
	}

	// console.info('create shapes time:', (Date.now()-s));

	return shapes;
}


Dots.prototype.viewChangeHandler = function(){
	if(!this.visible){
		this.scene.setShapes([]);

		return;
	}


	var indexes = this.getIndexesInCurrentBounds(),
		proj = this.getProjection(),
		viewBounds = this.qqmapBounds2LocalBounds(this.map.getBounds()),
		indexPixBounds,
		shapes = [],
		bounds,
		unionBounds,
		data,
		d,
		xy
	;

	var s = Date.now();
	var all = 0, dropd = 0;

	for(var i = 0, l = indexes.length; i< l; i++){
		
		let index = indexes[i];

		indexPixBounds = index.pixBounds = this.getPixBounds(index.bounds);

		data = index.shapes;

		bounds = index.bounds;
		data = index.shapes;
		
		all += index.shapes.length;
		
		if(!geo.boundsInBounds(bounds, viewBounds)){		
			unionBounds = geo.getUnionBounds(bounds, viewBounds);
			if(unionBounds){
				// data = this.getPointsInBounds(data, unionBounds);
				dropd += index.shapes.length - data.length;
			}
		}

		for(var j = 0, lj = data.length; j< lj; j++){
		
			d = data[j];

			/*
			 * relativePosition: 
			 * 一个点与其所在的索引bounds的左上角的距离占bounds宽、高的比值[0-1]
			 */
			if(d.relativePosition){

				xy = {
					x: indexPixBounds.x + indexPixBounds.w * d.relativePosition.x,
					y: indexPixBounds.y + indexPixBounds.h * d.relativePosition.y
				};

			}else{

				xy = proj.fromLatLngToContainerPixel(d.latlng);

				d.relativePosition = {
					x: (xy.x - indexPixBounds.x)/indexPixBounds.w,
					y: (xy.y - indexPixBounds.y)/indexPixBounds.h
				};
			}				

			d.dot.setPosition(xy.x, xy.y);

			shapes.push(d.dot);
		}
	}

	// console.info('get points\' pix cost time: ', Date.now()-s);

	// console.info('dropd', dropd, '/', all, 'dots');

	var allShapes = [];
	
	Array.prototype.push.apply(allShapes, shapes);
	Array.prototype.push.apply(allShapes, this.getBoundsRects());

	this.scene.setShapes(allShapes);
}


//别删，做对比
/*Dots.prototype.viewChangeHandler = function(){
	var 
		proj = this.getProjection(),
		shapes = [],
		data = this.data,
		d,
		xy;

	var s = Date.now();

	for(var i in data){
	
		d = data[i];
		
		xy = proj.fromLatLngToContainerPixel(d.latlng);

		d.dot.setPosition(xy.x, xy.y);

		shapes.push(d.dot);
	}
	


	var allShapes = [];
	
	Array.prototype.push.apply(allShapes, shapes);
	// Array.prototype.push.apply(allShapes, this.getBoundsRects());

	this.scene.setShapes(allShapes);
}

*/

Dots.prototype.getBoundsRects = function(){
	var indexes, rects = [];

	if(this.debug){
		
		indexes = this.spatialIndex.indexes;

		for(var i in indexes){	
			rects.push(new Rect({
				context: this.context,
				bounds: this.getPixBounds(indexes[i].bounds)
			}));
		}
	}

	return rects;
}

Dots.prototype.getPixBounds = function(mapBounds){
	var proj = this.getProjection(),
		min = mapBounds.min,
		max = mapBounds.max,
		leftTop = new qq.maps.LatLng(max.lat, min.lng),
		rightBottom = new qq.maps.LatLng(min.lat, max.lng),
		leftTopPix = proj.fromLatLngToContainerPixel(leftTop),
		rightBottomPix = proj.fromLatLngToContainerPixel(rightBottom),
		x = leftTopPix.x,
		y = leftTopPix.y,
		w = rightBottomPix.x - x,
		h = rightBottomPix.y - y
	;


	return {x:x, y:y, w:w, h:h};
};

Dots.prototype.getIndexesInCurrentBounds = function(){
	if(this.spatialIndex){
		var bounds = this.qqmapBounds2LocalBounds(this.map.getBounds());
		return this.spatialIndex.query(bounds);
	}
	return [];	
};

Dots.prototype.getDotsInCurrentBounds = function(){
	var result = [];
	var indexes = this.getIndexesInCurrentBounds();

	for(var i in indexes){
		Array.prototype.push.apply(result, indexes[i].shapes);
	}

	return result;
};

Dots.prototype.getPointsInBounds = function(points, bounds){
	var results = [];

	for(var i =0, point; point = points[i++];){
		if(geo.latlngInBounds(point, bounds)){
			results.push(point);
		}
	}

	return results;
}

Dots.prototype.qqmapBounds2LocalBounds = function(mapBounds){
	return {
		min: {
			lat: mapBounds.lat.minY,
			lng: mapBounds.lng.minX
		},
		max: {
			lat: mapBounds.lat.maxY,
			lng: mapBounds.lng.maxX
		}
	}
};

Dots.prototype.hide = function(){
	this.visible = false;
	this.viewChangeHandler();
    this.scene.render();
};

Dots.prototype.show = function(){
	this.visible = true;
	this.viewChangeHandler();
    this.scene.render();
};


function createEntity(style, groupStyles){
	var entities = {};

	entities['default'] = createDotCanvas(style);

	if(groupStyles){
		for(var i in groupStyles){
			entities[i] = createDotCanvas(groupStyles[i]);
		}
	}

	return entities;
}


function createDotCanvas(style){
	var canvas = document.createElement("canvas");
	var context = canvas.getContext("2d");
	var r = style.radius;
	var lineWidth = style.strokeWidth;

    canvas.width = 2 * r;
    canvas.height = 2 * r;
	
	context.fillStyle = style.fillColor;
	context.arc(r, r, r - lineWidth, 0, 2 * Math.PI);
	context.closePath();
    context.fill();

	context.strokeStyle = style.strokeColor;
    context.lineWidth = lineWidth;
	context.arc(r, r, r - lineWidth, 0, 2 * Math.PI);
    context.stroke();
    return canvas;
};




module.exports = Dots;
},{"../core/Animation.js":17,"../core/Util.js":20,"../core/geo.js":21,"./Dot.js":1,"./DotSpatialIndex.js":2,"./Rect.js":3}],5:[function(require,module,exports){

var Util = require('../core/Util.js');

var cellCanvas;

function Cell(options){
	if(!options || !options.context){
		return {};
	}

	this.context = options.context;
	this.style = {
		fillColor: 'rgba(220, 0, 0, 0.5)',
		strokeStyle: 'rgba(255,255,255, 0.8)'
	};
}

Cell.prototype = {
	bounds: {},//{lb, rt},左下角坐标和右上角坐标

	size: 50,//width and height of rect

	visibility: true,

	constructor: Cell,

	draw: function(){
		var ctx = this.context,
			bounds = this.bounds,
			x = bounds.x,
			y = bounds.y,
			w = (bounds.w || bounds.rt.x - x)-0.5,
			h = (bounds.h || bounds.lb.y -y)-0.5;

		ctx.beginPath();
		this.empty || (ctx.fillStyle = this.style.fillColor);
	    ctx.strokeStyle = this.empty? 'rgba(255,0,0,1)': this.style.strokeStyle;
	    ctx.lineWidth = 0.5;

		ctx.rect(x, y, w, h);
		ctx.closePath();
	    ctx.stroke();
	    this.empty || ctx.fill();
	},

	setBounds: function(bounds){
		this.bounds = bounds;
	},
	
	setColor: function(color){
		this.style.fillColor = color;
	}
};

module.exports = Cell;

},{"../core/Util.js":20}],6:[function(require,module,exports){
var Animation = require('../core/Animation.js');
var TextLabel = require('../core/TextLabel.js');
var geo = require('../core/geo.js');
var Cell = require('./Cell.js');

function Grid(option){
    if(!option){
        return;
    }

    //若empty为true，则只显示网格
    this.empty = false;

    this.cellSize = 1000; //unit: meter
    this.gradient = option.gradient || [
    	'rgba(139, 195, 74, .5)',
    	'rgba(255, 0, 0, .5)'
    ];

    this.getColor = (typeof option.getColor == 'function')? option.getColor.bind(this): this.getColor;
  	
    this.style = {
    	textColor: 'rgba(255,255,255, .8)',

        font: '20px Helvetica'
    }

    Animation.call(this, option);
};

Grid.prototype = new Animation();

Grid.prototype.construct = Grid;

Grid.prototype.buildDataAndShapes = function(data){
    this.data = this.buildData(data);
    this.scene.setShapes(this.createShapes(this.data));
    this.viewChangeHandler();
	this.scene.render();
};

Grid.prototype.buildData = function(data){
	var ctx = this.context, 
		cellsData = data.cells,
		style = this.style,
		shapes = [], 
		d;
		
	for(var i in data){
		d = data[i];
		d.cell = new Cell({
			context: ctx
		});
		d.label = new TextLabel({
			context: ctx,
			text: ~~d.val,
			style: {
				font: style.font,
				textColor: style.textColor
			}
		});
	}	

	return data;
}

Grid.prototype.createShapes = function(data){
	var cells = [], 
		labels = [],
		empty = this.empty,
		d;

	for(var i in data){
		d = data[i];
		d.cell && cells.push(d.cell);
		d.label && labels.push(d.label);
	}

	return cells.concat(labels);
}


Grid.prototype.viewChangeHandler = function(){
	var proj = this.getProjection();
	var data = this.data, 
		cellSize = this.cellSize,
		empty = this.empty, //若empty为true，则只显示网格线。
		d,
		max,
		textOffsetY,
		textOffsetX,
		_tmpCtx,
		showText
	;

	if(empty){
		showText = false;
	}else{
		max = this.getMaxValue(data);
		textOffsetY = parseInt(this.style.font) / 2 * 0.7;//0.7是试出来的
		_tmpCtx = document.createElement('canvas').getContext('2d');
		_tmpCtx.font = this.style.font;
	}

	for(var i in data){
		d = data[i];


		//使用服务端经纬度数据绘制rect
		// (function(){
		// 	var latlng = new qq.maps.LatLng(d[1], d[2]);
		// 	var lb = proj.fromLatLngToContainerPixel(latlng);	
		// 	var rtLatLng = qq.maps.geometry.spherical.computeOffset(latlng, cellSize*Math.sqrt(2), 45);
		// 	var rt = proj.fromLatLngToContainerPixel(rtLatLng);
		// 	d.rect = {x:lb.x, y:rt.y,w:rt.x-lb.x,h:lb.y-rt.y};
		// }());



		d.cell.setBounds(d.rect);
		d.cell.empty = empty;

		if(!empty){
			d.cell.setColor(this.getColor(~~d.val, max, d));
		}

		//只判断一次，若文字显示不下就不显示
		if(showText == undefined){
			// if(!d.rect){
			// 	debugger;
			// }
			textOffsetX = _tmpCtx.measureText(d.label.text).width/2;
			showText = (textOffsetX < d.rect.w/2);
		}

		if(showText){
			d.label && d.label.show().setPosition(d.rect.x + d.rect.w/2 - textOffsetX, d.rect.y + d.rect.h/2 + textOffsetY);
		}else{
			d.label && d.label.hide();
		}
	}

	_tmpCtx = null;
}

Grid.prototype.setStatus = function(status){
	var empty = status == 'empty';
	if(empty == this.empty){
		return;
	}
	
	this.empty = empty;
	
	this.resize();
	this.viewChangeHandler();
	this.scene.render();
}


Grid.prototype.getMaxValue = function(data){
	var d, value, max;

	for(var i in data){
		d = data[i];
		value = d.val;

		if(max == undefined){
			max = value;
		}else{
			max = Math.max(max, value);
		}
	}

	return max;
}

Grid.prototype.getColor = function(value, maxValue, data){
	if(value == 0){
		return 'rgba(0,0,255,0)';
	}
	var gradient = this.gradient;
	var rate = value/maxValue;
	var steps = gradient.length;
	
	return (gradient[Math.min(~~(rate * steps), steps-1)]);
}


Grid.prototype.setCellSize = function(size){
	this.cellSize = size;
}


/*
 * bounds:要计算的范围
 * wholeBounds:所有数据的范围
 *
 */
Grid.prototype.getCellsPixData = function(bounds, wholeBounds){
	var cellsPixData = {};
	var proj = this.getProjection();
	var bd = this.getXYBounds(bounds, wholeBounds);
	var wlb = wholeBounds.lb, wrt = wholeBounds.rt;
	var lb= bd.lb, rt = bd.rt;
	var w = wrt.x + 1 - wlb.x, h = wrt.y + 1 - wlb.y;
	var mcw = wrt.mcx - wlb.mcx, mch = wrt.mcy - wlb.mcy;
	var cellSize = this.cellSize;

	for(var yi = lb.y; yi <=rt.y; yi++){
		var mcy = wlb.mcy + mch*(yi - wlb.y)/h;
		var topMcy = wlb.mcy + mch * (yi + 1 - wlb.y)/h;

		for(var xi = lb.x; xi <=rt.x; xi++){		
			var mcx = wlb.mcx + mcw*(xi - wlb.x)/w;
			var rightMcx = wlb.mcx + mcw * (xi + 1 - wlb.x)/w;
			
			var ll = geo.mc2ll({x: mcx, y: mcy});
			var pixPosition = proj.fromLatLngToContainerPixel(new qq.maps.LatLng(ll.lat, ll.lng));
			
			var trll = geo.mc2ll({x: rightMcx, y: topMcy});
			var trPixPosition = proj.fromLatLngToContainerPixel(new qq.maps.LatLng(trll.lat, trll.lng));
			
			cellsPixData[xi+"_"+yi] = {
				min_lat: ll.lat,
				min_lng: ll.lng,
				max_lat: trll.lat,
				max_lng: trll.lng,
				x: pixPosition.x, 
				y: trPixPosition.y,
				h: pixPosition.y - trPixPosition.y,
				w: trPixPosition.x - pixPosition.x
			};
		}
	}

	return cellsPixData;
}


//现有逻辑，用经纬度坐标计算，与后端一致
Grid.prototype.getCellsPixData = function(bounds, cityBounds){
	var cellsPixData = {};
	var scale = this.cellSize/500;
	var proj = this.getProjection();
	
	var minX = Math.floor((cityBounds.min_X + (bounds.lng.minX - cityBounds.min_lng)/cityBounds.range_lng)/scale);
	var maxX = Math.floor((cityBounds.min_X + (bounds.lng.maxX - cityBounds.min_lng)/cityBounds.range_lng)/scale);
	var minY = Math.floor((cityBounds.min_Y + (bounds.lat.minY - cityBounds.min_lat)/cityBounds.range_lat)/scale);
	var maxY = Math.floor((cityBounds.min_Y + (bounds.lat.maxY - cityBounds.min_lat)/cityBounds.range_lat)/scale);
	
	cityBounds.range_lat = (cityBounds.max_lat - cityBounds.min_lat)/(cityBounds.max_Y - cityBounds.min_Y);
	cityBounds.range_lng = (cityBounds.max_lng - cityBounds.min_lng)/(cityBounds.max_X - cityBounds.min_X);

	for(var xi =minX; xi <= maxX; xi++){
		for(var yi =minY; yi <= maxY; yi++){
			var rectMinLat = cityBounds.min_lat + (yi * scale - cityBounds.min_Y) * cityBounds.range_lat ;
			var rectMinLng = cityBounds.min_lng + (xi * scale - cityBounds.min_X) * cityBounds.range_lng ;
			var rectMaxLat = rectMinLat + cityBounds.range_lat * scale;
			var rectMaxLng = rectMinLng + cityBounds.range_lng * scale;
			var leftBottomPix = proj.fromLatLngToContainerPixel(new qq.maps.LatLng(rectMinLat, rectMinLng));
			var rightTopPix = proj.fromLatLngToContainerPixel(new qq.maps.LatLng(rectMaxLat, rectMaxLng));
			
			cellsPixData[xi+"_"+yi] = {
				min_lat: rectMinLat,
				min_lng: rectMinLng,
				max_lat: rectMaxLat,
				max_lng: rectMaxLng,
				x: leftBottomPix.x, 
				y: rightTopPix.y,
				h: leftBottomPix.y - rightTopPix.y,
				w: rightTopPix.x - leftBottomPix.x
			};

		}
	}		

	return cellsPixData;	
}


//老的方式，用墨卡托坐标计算
Grid.prototype._getCellsPixData = function(bounds, wholeBounds){
	var cellsPixData = {};
	var proj = this.getProjection();
	var bd = this.getXYBounds(bounds, wholeBounds);
	var wlb = wholeBounds.lb, wrt = wholeBounds.rt;
	var lb= bd.lb, rt = bd.rt;
	var w = wrt.x + 1 - wlb.x, h = wrt.y + 1 - wlb.y;
	var mcw = wrt.mcx - wlb.mcx, mch = wrt.mcy - wlb.mcy;
	var cellSize = this.cellSize;

	for(var yi = lb.y; yi <=rt.y; yi++){
		var mcy = wlb.mcy + mch*(yi - wlb.y)/h;
		var topMcy = wlb.mcy + mch * (yi + 1 - wlb.y)/h;

		for(var xi = lb.x; xi <=rt.x; xi++){		
			var mcx = wlb.mcx + mcw*(xi - wlb.x)/w;
			var rightMcx = wlb.mcx + mcw * (xi + 1 - wlb.x)/w;
			
			var ll = geo.mc2ll({x: mcx, y: mcy});
			var pixPosition = proj.fromLatLngToContainerPixel(new qq.maps.LatLng(ll.lat, ll.lng));
			
			var trll = geo.mc2ll({x: rightMcx, y: topMcy});
			var trPixPosition = proj.fromLatLngToContainerPixel(new qq.maps.LatLng(trll.lat, trll.lng));
			
			cellsPixData[xi+"_"+yi] = {
				min_lat: ll.lat,
				min_lng: ll.lng,
				max_lat: trll.lat,
				max_lng: trll.lng,
				x: pixPosition.x, 
				y: trPixPosition.y,
				h: pixPosition.y - trPixPosition.y,
				w: trPixPosition.x - pixPosition.x
			};
		}
	}

	return cellsPixData;
}


//x,y 为网格的序号，地图定位到某个网格的中心点
Grid.prototype.getCellCeneterByXY = function(x, y, cityBounds){
	var scale = this.cellSize/500;
	var lat = cityBounds.min_lat + (y - cityBounds.min_Y/scale + 0.5) * cityBounds.range_lat * scale;
	var lng = cityBounds.min_lng + (x - cityBounds.min_X/scale + 0.5) * cityBounds.range_lng * scale;
	return new qq.maps.LatLng(lat, lng);
}




/**
 * 计算bounds范围内的cell的xy范围
 * wholeBounds是指有数据区域的bounds，由服务端返回
 */
Grid.prototype.getXYBounds = function(bounds, wholeBounds){
	var wlb = wholeBounds.lb;
	var wrt = wholeBounds.rt;
	var mclb = geo.ll2mc({lat:bounds.lat.minY, lng: bounds.lng.minX});
	var mcrt = geo.ll2mc({lat:bounds.lat.maxY, lng: bounds.lng.maxX});

	return {
		lb: getXYByMC(mclb, wholeBounds), 
		rt: getXYByMC(mcrt, wholeBounds)
	};
}

/**
 * 计算经纬度点所在的cell的xy坐标,起点为(0，0)
 * wholeBounds是指有数据区域的bounds，由服务端返回
 *
 */
 function getXYByMC(mc, wholeBounds){
	var rt = wholeBounds.rt, 
		lb = wholeBounds.lb,
		x = lb.x + ~~((rt.x-lb.x + 1)*(mc.x - lb.mcx)/(rt.mcx- lb.mcx)),
		y = lb.y + ~~((rt.y-lb.y + 1)*(mc.y - lb.mcy)/(rt.mcy- lb.mcy));

	return {x: Math.min(rt.x, Math.max(0, x)), y: Math.min(rt.y, Math.max(0, y))};
}

/**
 * 计算xy坐标左下角的墨卡托坐标,x,y起点为(0,0)
 * wholeBounds是指有数据区域的bounds，由服务端返回
 *
 */
function getMCByXY(xy, wholeBounds){
	var rt = wholeBounds.rt, 
		lb = wholeBounds.lb,
		mcx = lb.mcx + (rt.mcx - lb.mcx) * (xy.x-lb.x)/(rt.x-lb.x + 1);
		mcy = lb.mcy + (rt.mcy - lb.mcy) * (xy.y-lb.y)/(rt.y-lb.y + 1);
	;

	return {mcx: mcx, mcy: mcy}
}

console.info(function(){
	Grid.prototype.drawGridByLatlng = function(){
		var proj = this.getProjection();
		var data = this.data;
		this.context.fillStyle='rgba(255,255,0,0.2)';
		for(var i in data){
			var d = data[i];
			var latlng = new qq.maps.LatLng(d.lat, d.lng);
			var lb = proj.fromLatLngToContainerPixel(latlng);	
			var rtLatLng = qq.maps.geometry.spherical.computeOffset(latlng, 1.01*1000*Math.sqrt(2), 45);
			var rt = proj.fromLatLngToContainerPixel(rtLatLng);
			d.rect = {x:lb.x, y:rt.y,w:rt.x-lb.x,h:lb.y-rt.y};
			this.context.fillRect(lb.x, rt.y, rt.x-lb.x, lb.y-rt.y);
		}

		// 	var latlng = new qq.maps.LatLng(d[1], d[2]);
		// 	var lb = proj.fromLatLngToContainerPixel(latlng);	
		// 	var rtLatLng = qq.maps.geometry.spherical.computeOffset(latlng, cellSize*Math.sqrt(2), 45);
		// 	var rt = proj.fromLatLngToContainerPixel(rtLatLng);
		// 	d.rect = {x:lb.x, y:rt.y,w:rt.x-lb.x,h:lb.y-rt.y};
	}
}());

//{x: 0, y: 30}
// console.info('getXY', getXY({lat: 31.214571623892628, lng: 120.86200792412266}, data.info.bounds));


// Grid.prototype.buildGradient = function(){
// 	var colors = this.colors;
// 	var gradient = [];
// 	var steps = 4;
// 	console.info(colors);

// 	for(var i=0, l = colors.length-2;i<l; i++){
// 		gradient.pop();
// 		gradient = gradient.concat(this.getColors(colors[i], colors[i+1], steps));
// 	}


// 	return gradient;
// }

// //计算渐变色数组
// Grid.prototype.getColors = function(startColor, endColor, steps){
// 	steps = (steps || 4) - 1;
// 	var colors = [];
// 	var step0 = (endColor[0] - startColor[0])/steps;
// 	var step1 = (endColor[1] - startColor[1])/steps;
// 	var step2 = (endColor[2] - startColor[2])/steps;

// 	colors.push(['rgba(', startColor.join(','),')'].join(''));

// 	for(var i=1; i<steps; i++){
// 		colors[i] = [
// 			'rgba(', 
// 			[
// 				Math.round(startColor[0] + i*step0), 
// 				Math.round(startColor[1] + i*step1), 
// 				Math.round(startColor[2] + i*step2)
// 			].join(','),
// 			',',
// 			startColor[3],
// 			')'

// 		].join('');
// 	}

// 	colors.push(['rgba(', endColor.join(','),')'].join(''));

// 	return colors;
// }
// //


module.exports = Grid;
},{"../core/Animation.js":17,"../core/TextLabel.js":19,"../core/geo.js":21,"./Cell.js":5}],7:[function(require,module,exports){
/*
 * heatmap.js v2.0.0 | JavaScript Heatmap Library
 *
 * Copyright 2008-2014 Patrick Wied <heatmapjs@patrick-wied.at> - All rights reserved.
 * Dual licensed under MIT and Beerware license 
 *
 * :: 2014-10-31 21:16
 */
;(function (name, context, factory) {

  // Supports UMD. AMD, CommonJS/Node.js and browser context
  if (typeof module !== "undefined" && module.exports) {
    module.exports = factory();
  } else if (typeof define === "function" && define.amd) {
    define(factory);
  } else {
    context[name] = factory();
  }

})("h337", this, function () {

// Heatmap Config stores default values and will be merged with instance config
var HeatmapConfig = {
  defaultRadius: 20,
  defaultRenderer: 'canvas2d',
  defaultGradient: { 0.25: "rgb(0,0,255)", 0.55: "rgb(0,255,0)", 0.85: "yellow", 1.0: "rgb(255,0,0)"},
  defaultMaxOpacity: 1,
  defaultMinOpacity: 0,
  defaultBlur: .85,
  defaultXField: 'x',
  defaultYField: 'y',
  defaultValueField: 'value', 
  plugins: {}
};
var Store = (function StoreClosure() {

  var Store = function Store(config) {
    this._coordinator = {};
    this._data = [];
    this._radi = [];
    this._min = 0;
    this._max = 1;
    this._xField = config['xField'] || config.defaultXField;
    this._yField = config['yField'] || config.defaultYField;
    this._valueField = config['valueField'] || config.defaultValueField;

    if (config["radius"]) {
      this._cfgRadius = config["radius"];
    }
  };

  var defaultRadius = HeatmapConfig.defaultRadius;

  Store.prototype = {
    // when forceRender = false -> called from setData, omits renderall event
    _organiseData: function(dataPoint, forceRender) {
        var x = dataPoint[this._xField];
        var y = dataPoint[this._yField];
        var radi = this._radi;
        var store = this._data;
        var max = this._max;
        var min = this._min;
        var value = dataPoint[this._valueField] || 1;
        var radius = dataPoint.radius || this._cfgRadius || defaultRadius;

        if (!store[x]) {
          store[x] = [];
          radi[x] = [];
        }

        if (!store[x][y]) {
          store[x][y] = value;
          radi[x][y] = radius;
        } else {
          store[x][y] += value;
        }

        if (store[x][y] > max) {
          if (!forceRender) {
            this._max = store[x][y];
          } else {
            this.setDataMax(store[x][y]);
          }
          return false;
        } else{
          return { 
            x: x, 
            y: y,
            value: value, 
            radius: radius,
            min: min,
            max: max 
          };
        }
    },
    _unOrganizeData: function() {
      var unorganizedData = [];
      var data = this._data;
      var radi = this._radi;

      for (var x in data) {
        for (var y in data[x]) {

          unorganizedData.push({
            x: x,
            y: y,
            radius: radi[x][y],
            value: data[x][y]
          });

        }
      }
      return {
        min: this._min,
        max: this._max,
        data: unorganizedData
      };
    },
    _onExtremaChange: function() {
      this._coordinator.emit('extremachange', {
        min: this._min,
        max: this._max
      });
    },
    addData: function() {
      if (arguments[0].length > 0) {
        var dataArr = arguments[0];
        var dataLen = dataArr.length;
        while (dataLen--) {
          this.addData.call(this, dataArr[dataLen]);
        }
      } else {
        // add to store  
        var organisedEntry = this._organiseData(arguments[0], true);
        if (organisedEntry) {
          this._coordinator.emit('renderpartial', {
            min: this._min,
            max: this._max,
            data: [organisedEntry]
          });
        }
      }
      return this;
    },
    setData: function(data) {
      var dataPoints = data.data;
      var pointsLen = dataPoints.length;


      // reset data arrays
      this._data = [];
      this._radi = [];

      for(var i = 0; i < pointsLen; i++) {
        this._organiseData(dataPoints[i], false);
      }
      this._max = data.max;
      this._min = data.min || 0;
      
      this._onExtremaChange();
      this._coordinator.emit('renderall', this._getInternalData());
      return this;
    },
    removeData: function() {
      // TODO: implement
    },
    setDataMax: function(max) {
      this._max = max;
      this._onExtremaChange();
      this._coordinator.emit('renderall', this._getInternalData());
      return this;
    },
    setDataMin: function(min) {
      this._min = min;
      this._onExtremaChange();
      this._coordinator.emit('renderall', this._getInternalData());
      return this;
    },
    setCoordinator: function(coordinator) {
      this._coordinator = coordinator;
    },
    _getInternalData: function() {
      return { 
        max: this._max,
        min: this._min, 
        data: this._data,
        radi: this._radi 
      };
    },
    getData: function() {
      return this._unOrganizeData();
    }/*,

      TODO: rethink.

    getValueAt: function(point) {
      var value;
      var radius = 100;
      var x = point.x;
      var y = point.y;
      var data = this._data;

      if (data[x] && data[x][y]) {
        return data[x][y];
      } else {
        var values = [];
        // radial search for datapoints based on default radius
        for(var distance = 1; distance < radius; distance++) {
          var neighbors = distance * 2 +1;
          var startX = x - distance;
          var startY = y - distance;

          for(var i = 0; i < neighbors; i++) {
            for (var o = 0; o < neighbors; o++) {
              if ((i == 0 || i == neighbors-1) || (o == 0 || o == neighbors-1)) {
                if (data[startY+i] && data[startY+i][startX+o]) {
                  values.push(data[startY+i][startX+o]);
                }
              } else {
                continue;
              } 
            }
          }
        }
        if (values.length > 0) {
          return Math.max.apply(Math, values);
        }
      }
      return false;
    }*/
  };


  return Store;
})();

var Canvas2dRenderer = (function Canvas2dRendererClosure() {
  
  var _getColorPalette = function(config) {
    var gradientConfig = config.gradient || config.defaultGradient;
    var paletteCanvas = document.createElement('canvas');
    var paletteCtx = paletteCanvas.getContext('2d');

    paletteCanvas.width = 256;
    paletteCanvas.height = 1;

    var gradient = paletteCtx.createLinearGradient(0, 0, 256, 1);
    for (var key in gradientConfig) {
      gradient.addColorStop(key, gradientConfig[key]);
    }

    paletteCtx.fillStyle = gradient;
    paletteCtx.fillRect(0, 0, 256, 1);

    return paletteCtx.getImageData(0, 0, 256, 1).data;
  };

  var _getPointTemplate = function(radius, blurFactor) {
    var tplCanvas = document.createElement('canvas');
    var tplCtx = tplCanvas.getContext('2d');
    var x = radius;
    var y = radius;
    tplCanvas.width = tplCanvas.height = radius*2;

    if (blurFactor == 1) {
      tplCtx.beginPath();
      tplCtx.arc(x, y, radius, 0, 2 * Math.PI, false);
      tplCtx.fillStyle = 'rgba(0,0,0,1)';
      tplCtx.fill();
    } else {
      var gradient = tplCtx.createRadialGradient(x, y, radius*blurFactor, x, y, radius);
      gradient.addColorStop(0, 'rgba(0,0,0,1)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      tplCtx.fillStyle = gradient;
      tplCtx.fillRect(0, 0, 2*radius, 2*radius);
    }
    
    

    return tplCanvas;
  };

  var _prepareData = function(data) {
    var renderData = [];
    var min = data.min;
    var max = data.max;
    var radi = data.radi;
    var data = data.data;
    
    var xValues = Object.keys(data);
    var xValuesLen = xValues.length;

    while(xValuesLen--) {
      var xValue = xValues[xValuesLen];
      var yValues = Object.keys(data[xValue]);
      var yValuesLen = yValues.length;
      while(yValuesLen--) {
        var yValue = yValues[yValuesLen];
        var value = data[xValue][yValue];
        var radius = radi[xValue][yValue];
        renderData.push({
          x: xValue,
          y: yValue,
          value: value,
          radius: radius
        });
      }
    }

    return {
      min: min,
      max: max,
      data: renderData
    };
  };


  function Canvas2dRenderer(config) {
    var container = config.container;
    var shadowCanvas = this.shadowCanvas = document.createElement('canvas');
    var canvas = this.canvas = config.canvas || document.createElement('canvas');
    var renderBoundaries = this._renderBoundaries = [10000, 10000, 0, 0];

    var computed = getComputedStyle(config.container) || {};

    canvas.className = 'heatmap-canvas';

    this._width = canvas.width = shadowCanvas.width = +(computed.width.replace(/px/,''));
    this._height = canvas.height = shadowCanvas.height = +(computed.height.replace(/px/,''));

    this.shadowCtx = shadowCanvas.getContext('2d');
    this.ctx = canvas.getContext('2d');

    // @TODO:
    // conditional wrapper

    canvas.style.cssText = shadowCanvas.style.cssText = 'position:absolute;left:0;top:0;';

    container.style.position = 'absolute';

    container.appendChild(canvas);

    this._palette = _getColorPalette(config);
    this._templates = {};

    this._setStyles(config);
  };

  Canvas2dRenderer.prototype = {
    renderPartial: function(data) {
      this._drawAlpha(data);
      this._colorize();
    },
    renderAll: function(data) {
      // reset render boundaries
      this._clear();
      this._drawAlpha(_prepareData(data));
      this._colorize();
    },
    _updateGradient: function(config) {
      this._palette = _getColorPalette(config);
    },
    updateConfig: function(config) {
      if (config['gradient']) {
        this._updateGradient(config);
      }
      this._setStyles(config);
    },
    setDimensions: function(width, height) {
      this._width = width;
      this._height = height;
      this.canvas.width = this.shadowCanvas.width = width;
      this.canvas.height = this.shadowCanvas.height = height;
    },
    _clear: function() {
      this.shadowCtx.clearRect(0, 0, this._width, this._height);
      this.ctx.clearRect(0, 0, this._width, this._height);
    },
    _setStyles: function(config) {
      this._blur = (config.blur == 0)?0:(config.blur || config.defaultBlur);

      if (config.backgroundColor) {
        this.canvas.style.backgroundColor = config.backgroundColor;
      }

      this._opacity = (config.opacity || 0) * 255;
      this._maxOpacity = (config.maxOpacity || config.defaultMaxOpacity) * 255;
      this._minOpacity = (config.minOpacity || config.defaultMinOpacity) * 255;
      this._useGradientOpacity = !!config.useGradientOpacity;
    },
    _drawAlpha: function(data) {
      var min = this._min = data.min;
      var max = this._max = data.max;
      var data = data.data || [];
      var dataLen = data.length;
      // on a point basis?
      var blur = 1 - this._blur;

      while(dataLen--) {

        var point = data[dataLen];

        var x = point.x;
        var y = point.y;
        var radius = point.radius;
        // if value is bigger than max
        // use max as value
        var value = Math.min(point.value, max);
        var rectX = x - radius;
        var rectY = y - radius;
        var shadowCtx = this.shadowCtx;




        var tpl;
        if (!this._templates[radius]) {
          this._templates[radius] = tpl = _getPointTemplate(radius, blur);
        } else {
          tpl = this._templates[radius];
        }
        // value from minimum / value range
        // => [0, 1]
        shadowCtx.globalAlpha = (value-min)/(max-min);

        shadowCtx.drawImage(tpl, rectX, rectY);

        // update renderBoundaries
        if (rectX < this._renderBoundaries[0]) {
            this._renderBoundaries[0] = rectX;
          } 
          if (rectY < this._renderBoundaries[1]) {
            this._renderBoundaries[1] = rectY;
          }
          if (rectX + 2*radius > this._renderBoundaries[2]) {
            this._renderBoundaries[2] = rectX + 2*radius;
          }
          if (rectY + 2*radius > this._renderBoundaries[3]) {
            this._renderBoundaries[3] = rectY + 2*radius;
          }

      }
    },
    _colorize: function() {
      var x = this._renderBoundaries[0];
      var y = this._renderBoundaries[1];
      var width = this._renderBoundaries[2] - x;
      var height = this._renderBoundaries[3] - y;
      var maxWidth = this._width;
      var maxHeight = this._height;
      var opacity = this._opacity;
      var maxOpacity = this._maxOpacity;
      var minOpacity = this._minOpacity;
      var useGradientOpacity = this._useGradientOpacity;

      if (x < 0) {
        x = 0;
      }
      if (y < 0) {
        y = 0;
      }
      if (x + width > maxWidth) {
        width = maxWidth - x;
      }
      if (y + height > maxHeight) {
        height = maxHeight - y;
      }

      var img = this.shadowCtx.getImageData(x, y, width, height);
      var imgData = img.data;
      var len = imgData.length;
      var palette = this._palette;


      for (var i = 3; i < len; i+= 4) {
        var alpha = imgData[i];
        var offset = alpha * 4;


        if (!offset) {
          continue;
        }

        var finalAlpha;
        if (opacity > 0) {
          finalAlpha = opacity;
        } else {
          if (alpha < maxOpacity) {
            if (alpha < minOpacity) {
              finalAlpha = minOpacity;
            } else {
              finalAlpha = alpha;
            }
          } else {
            finalAlpha = maxOpacity;
          }
        }

        imgData[i-3] = palette[offset];
        imgData[i-2] = palette[offset + 1];
        imgData[i-1] = palette[offset + 2];
        imgData[i] = useGradientOpacity ? palette[offset + 3] : finalAlpha;

      }

      img.data = imgData;
      this.ctx.putImageData(img, x, y);

      this._renderBoundaries = [1000, 1000, 0, 0];

    },
    getValueAt: function(point) {
      var value;
      var shadowCtx = this.shadowCtx;
      var img = shadowCtx.getImageData(point.x, point.y, 1, 1);
      var data = img.data[3];
      var max = this._max;
      var min = this._min;

      value = (Math.abs(max-min) * (data/255)) >> 0;

      return value;
    },
    getDataURL: function() {
      return this.canvas.toDataURL();
    }
  };


  return Canvas2dRenderer;
})();

var Renderer = (function RendererClosure() {

  var rendererFn = false;

  if (HeatmapConfig['defaultRenderer'] === 'canvas2d') {
    rendererFn = Canvas2dRenderer;
  }

  return rendererFn;
})();


var Util = {
  merge: function() {
    var merged = {};
    var argsLen = arguments.length;
    for (var i = 0; i < argsLen; i++) {
      var obj = arguments[i]
      for (var key in obj) {
        merged[key] = obj[key];
      }
    }
    return merged;
  }
};
// Heatmap Constructor
var Heatmap = (function HeatmapClosure() {

  var Coordinator = (function CoordinatorClosure() {

    function Coordinator() {
      this.cStore = {};
    };

    Coordinator.prototype = {
      on: function(evtName, callback, scope) {
        var cStore = this.cStore;

        if (!cStore[evtName]) {
          cStore[evtName] = [];
        }
        cStore[evtName].push((function(data) {
            return callback.call(scope, data);
        }));
      },
      emit: function(evtName, data) {
        var cStore = this.cStore;
        if (cStore[evtName]) {
          var len = cStore[evtName].length;
          for (var i=0; i<len; i++) {
            var callback = cStore[evtName][i];
            callback(data);
          }
        }
      }
    };

    return Coordinator;
  })();


  var _connect = function(scope) {
    var renderer = scope._renderer;
    var coordinator = scope._coordinator;
    var store = scope._store;

    coordinator.on('renderpartial', renderer.renderPartial, renderer);
    coordinator.on('renderall', renderer.renderAll, renderer);
    coordinator.on('extremachange', function(data) {
      scope._config.onExtremaChange &&
      scope._config.onExtremaChange({
        min: data.min,
        max: data.max,
        gradient: scope._config['gradient'] || scope._config['defaultGradient']
      });
    });
    store.setCoordinator(coordinator);
  };


  function Heatmap() {
    var config = this._config = Util.merge(HeatmapConfig, arguments[0] || {});
    this._coordinator = new Coordinator();
    if (config['plugin']) {
      var pluginToLoad = config['plugin'];
      if (!HeatmapConfig.plugins[pluginToLoad]) {
        throw new Error('Plugin \''+ pluginToLoad + '\' not found. Maybe it was not registered.');
      } else {
        var plugin = HeatmapConfig.plugins[pluginToLoad];
        // set plugin renderer and store
        this._renderer = new plugin.renderer(config);
        this._store = new plugin.store(config);
      }
    } else {
      this._renderer = new Renderer(config);
      this._store = new Store(config);
    }
    _connect(this);
  };

  // @TODO:
  // add API documentation
  Heatmap.prototype = {
    addData: function() {
      this._store.addData.apply(this._store, arguments);
      return this;
    },
    removeData: function() {
      this._store.removeData && this._store.removeData.apply(this._store, arguments);
      return this;
    },
    setData: function() {
      this._store.setData.apply(this._store, arguments);
      return this;
    },
    setDataMax: function() {
      this._store.setDataMax.apply(this._store, arguments);
      return this;
    },
    setDataMin: function() {
      this._store.setDataMin.apply(this._store, arguments);
      return this;
    },
    configure: function(config) {
      this._config = Util.merge(this._config, config);
      this._renderer.updateConfig(this._config);
      this._coordinator.emit('renderall', this._store._getInternalData());
      return this;
    },
    repaint: function() {
      this._coordinator.emit('renderall', this._store._getInternalData());
      return this;
    },
    getData: function() {
      return this._store.getData();
    },
    getDataURL: function() {
      return this._renderer.getDataURL();
    },
    getValueAt: function(point) {

      if (this._store.getValueAt) {
        return this._store.getValueAt(point);
      } else  if (this._renderer.getValueAt) {
        return this._renderer.getValueAt(point);
      } else {
        return null;
      }
    }
  };

  return Heatmap;

})();


// core
var heatmapFactory = {
  create: function(config) {
    return new Heatmap(config);
  },
  register: function(pluginKey, plugin) {
    HeatmapConfig.plugins[pluginKey] = plugin;
  }
};

return heatmapFactory;


});
},{}],8:[function(require,module,exports){
(function () {
    var h337 = require('./heatmap.js');
    
    var QQMapPlugin = window.QQMapPlugin = window.QQMapPlugin || {};

    function HeatmapOverlay(map, cfg) {
        this.setMap(map);
        this.map = map;
        this.cfg = cfg || {};
        qq.maps.Overlay.call(this);
    }

    HeatmapOverlay.prototype = new qq.maps.Overlay();

    HeatmapOverlay.CSS_TRANSFORM = (function () {
        var div = document.createElement('div');
        var props = [
            'transform',
            'WebkitTransform',
            'MozTransform',
            'OTransform',
            'msTransform'
        ];

        for (var i = 0; i < props.length; i++) {
            var prop = props[i];
            if (div.style[prop] !== undefined) {
                return prop;
            }
        }

        return props[0];
    })();


    HeatmapOverlay.prototype.construct = function () {
        var container = this.container = document.createElement('div');
        var map = this.map;
        var mapDiv = map.getContainer();
        var width = this.width = mapDiv.clientWidth;
        var height = this.height = mapDiv.clientHeight;


        this.cfg.container = container;

        container.style.cssText = 'width:' + width + 'px;height:' + height + 'px;';


        this.data = [];
        this.max = 1;
        this.min = 0;

        this.getPanes().overlayLayer.appendChild(container);
        var self = this;

        this.changeHandler = qq.maps.event.addListener(
            map,
            'bounds_changed',
            function () {
                self.draw();
            }
        );

        if (!this.heatmap) {
            this.heatmap = h337.create(this.cfg);
        }

        this.constructed = true;
    };

    HeatmapOverlay.prototype.show = function () {
        this.container.style.display = "";
    };

    HeatmapOverlay.prototype.hide = function () {
        this.container.style.display = "none";
    };

    HeatmapOverlay.prototype.destroy = function () {
        this.container.parentElement.removeChild(this.container);

        if (this.changeHandler) {
            qq.maps.event.removeListener(this.changeHandler);
            this.changeHandler = null;
        }

    };

    HeatmapOverlay.prototype.draw = function () {
        if (!this.map) {
            return;
        }

        var bounds = this.map.getBounds();

        var topLeft = new qq.maps.LatLng(
            bounds.getNorthEast().getLat(),
            bounds.getSouthWest().getLng()
        );

        var projection = this.getProjection();
        var point = projection.fromLatLngToDivPixel(topLeft);

        this.container.style[HeatmapOverlay.CSS_TRANSFORM] = 'translate(' +
        Math.round(point.x) + 'px,' +
        Math.round(point.y) + 'px)';

        this.update();
    };


    HeatmapOverlay.prototype.resize = function () {

        if (!this.map) {
            return;
        }

        var div = this.map.getContainer(),
            width = div.clientWidth,
            height = div.clientHeight;

        if (width == this.width && height == this.height) {
            return;
        }

        this.width = width;
        this.height = height;
        this.heatmap._renderer.setDimensions(width, height);
    };

    HeatmapOverlay.prototype.update = function () {
        var projection = this.map.getProjection(),
            zoom, scale, bounds, topLeft;

        if (!projection) {
            return;
        }

        bounds = this.map.getBounds();

        topLeft = new qq.maps.LatLng(
            bounds.getNorthEast().getLat(),
            bounds.getSouthWest().getLng()
        );

        zoom = this.map.getZoom();
        scale = Math.pow(2, zoom);

        this.resize();

        if (this.data.length == 0) {
            return;
        }

        var generatedData = {max: this.max, min: this.min};
        var latLngPoints = [];
        var len = this.data.length;
        var layerProjection = this.getProjection();
        var layerOffset = layerProjection.fromLatLngToDivPixel(topLeft);
        var radiusMultiplier = this.cfg.scaleRadius ? scale : 20;
        var localMax = 0;
        var localMin = 0;
        var valueField = this.cfg.valueField;
        while (len--) {
            var entry = this.data[len];
            var value = entry[valueField];
            var latlng = entry.latlng;
            if (!bounds.contains(latlng)) {
                continue;
            }
            localMax = Math.max(value, localMax);
            localMin = Math.min(value, localMin);


            var point = layerProjection.fromLatLngToDivPixel(latlng);
            var latlngPoint = {x: Math.round(point.x - layerOffset.x), y: Math.round(point.y - layerOffset.y)};
            latlngPoint[valueField] = value;

            var radius;

            if (entry.radius) {
                radius = entry.radius * radiusMultiplier;
            } else {
                radius = (this.cfg.radius || 2) * radiusMultiplier;
            }

            latlngPoint.radius = radius;
            latLngPoints.push(latlngPoint);
        }
        if (this.cfg.useLocalExtrema) {
            generatedData.max = localMax;
            generatedData.min = localMin;
        }

        generatedData.data = latLngPoints;
        this.heatmap.setData(generatedData);

    };

    HeatmapOverlay.prototype.setData = function (data) {
        var self = this;
        if (this.constructed) {
            this.max = data.max;
            this.min = data.min;

            var latField = this.cfg.latField || 'lat';
            var lngField = this.cfg.lngField || 'lng';
            var valueField = this.cfg.valueField || 'value';

            // transform data to latlngs
            var data = data.data;
            var len = data.length;
            var d = [];

            while (len--) {
                var entry = data[len];
                var latlng = new qq.maps.LatLng(entry[latField], entry[lngField]);
                var dataObj = {latlng: latlng};
                dataObj[valueField] = entry[valueField];
                if (entry.radius) {
                    dataObj.radius = entry.radius;
                }
                d.push(dataObj);
            }
            this.data = d;
            this.update();
        } else {
            //处理异步问题
            setTimeout(function () {
                self.setData(data);
            }, 100)
        }

    };
    HeatmapOverlay.prototype.addData = function (pointOrArray) {
        if (pointOrArray.length > 0) {
            var len = pointOrArray.length;
            while (len--) {
                this.addData(pointOrArray[len]);
            }
        } else {
            var latField = this.cfg.latField || 'lat';
            var lngField = this.cfg.lngField || 'lng';
            var valueField = this.cfg.valueField || 'value';
            var entry = pointOrArray;
            var latlng = new qq.maps.LatLng(entry[latField], entry[lngField]);
            var dataObj = {latlng: latlng};

            dataObj[valueField] = entry[valueField];
            if (entry.radius) {
                dataObj.radius = entry.radius;
            }
            this.max = Math.max(this.max, dataObj[valueField]);
            this.min = Math.min(this.min, dataObj[valueField]);
            this.data.push(dataObj);
            this.update();
        }
    };

    function supportCanvas() {
        var c = document.createElement("canvas");
        return !!(c.getContext && c.getContext("2d"));
    }

    QQMapPlugin["isSupportCanvas"] = supportCanvas();
    QQMapPlugin["HeatmapOverlay"] = HeatmapOverlay;

    module.exports = HeatmapOverlay;
})();
},{"./heatmap.js":7}],9:[function(require,module,exports){
;(function() {
  var utils = {
    // color:rgb或rgba格式
    // opacity: 透明度
    calculateColor: function(color, opacity) {
      if (color.indexOf('#') === 0) {
        var color16 = color.slice(1);
        var r = parseInt(color16.slice(0, 2), 16);
        var g = parseInt(color16.slice(2, 4), 16);
        var b = parseInt(color16.slice(4), 16);
        return 'rgba(' + r + ',' + g + ',' + b + ',' + opacity + ')';
      } else if (/^rgb\(/.test(color)) {
        return color.replace(/rgb/, 'rgba').replace(')', ",") +
          opacity + ')';
      } else {
        return color.split(',').splice(0, 3).join(',') +
          opacity + ')';
      }
    }
  };
  var arrayUtils = {
    forEach: function(arr, cb, scope) {
      if (typeof Array.prototype.forEach === 'function') {
        arr.forEach(cb, scope);
      } else {
        for (var i = 0, len = arr.length; i < len; i++) {
          cb.apply(scope, [arr[i], i, arr]);
        }
      }
    },
    map: function(arr, cb, scope) {
      if (typeof Array.prototype.map === 'function') {
        return arr.map(cb, scope);
      } else {
        var mapped = [];
        for (var i = 0, len = arr.length; i < len; i++) {
          mapped[i] = cb.apply(scope, [arr[i], i, arr]);
        }
        return mapped;
      }
    }
  };

  var Marker = (function() {
    var M = function(options) {
      this.x = options.x;
      this.y = options.y;
      this.rotation = options.rotation;
      this.style = options.style;
      this.color = options.color;
      this.size = options.size;
      this.borderWidth = options.borderWidth;
      this.borderColor = options.borderColor;
    };

    M.prototype.draw = function(context) {
      context.save();
      context.translate(this.x, this.y);
      context.rotate(this.rotation);

      context.lineWidth = this.borderWidth || 0;
      context.strokeStyle = this.borderColor || '#000';
      context.fillStyle = this.color || '#000';
      // 目前先只支持圆
        context.beginPath();
      if (this.style === 'circle') {
        context.arc(0, 0, this.size, 0, Math.PI * 2, false);
      } else if (this.style === 'arrow') {
        context.moveTo(-this.size, -this.size);
        context.lineTo(this.size, 0);
        context.lineTo(-this.size, this.size);
        context.lineTo(-this.size / 4, 0);
        context.lineTo(-this.size, -this.size);
      }
      context.closePath();
      context.stroke();
      context.fill();
      context.restore();
    };

    return M;
  })();

  var Arc = (function() {
    var A = function(options) {
      var startX = options.startX,
      startY = options.startY,
      endX = options.endX,
      endY = options.endY;

      //两点之间的圆有多个，通过两点及半径便可以定出两个圆，根据需要选取其中一个圆
      var L = Math.sqrt(Math.pow(startX - endX, 2) + Math.pow(startY - endY, 2));
      var m = (startX + endX) / 2; // 横轴中点
      var n = (startY + endY) / 2; // 纵轴中点
      var factor = 1.5;

      var centerX = (startY - endY) * factor + m;
      var centerY = (endX - startX) * factor + n;

      var radius = Math.sqrt(Math.pow(L / 2, 2) + Math.pow(L * factor, 2));
      var startAngle = Math.atan2(startY - centerY, startX - centerX);
      var endAngle = Math.atan2(endY - centerY, endX - centerX);

      // this.L = L;
      this.startX = startX;
      this.startY = startY;
      this.endX = endX;
      this.endY = endY;
      this.centerX = centerX;
      this.centerY = centerY;
      this.startAngle = startAngle;
      this.endAngle = endAngle;
      this.startLabel = options && options.labels && options.labels[0],
      this.endLabel = options && options.labels && options.labels[1],
      this.radius = radius;
      this.lineWidth = options.width || 1;
      this.strokeStyle = options.color || '#000';
      this.shadowBlur = options.shadowBlur;
    };

    A.prototype.draw = function(context) {
      context.save();
      context.lineWidth = this.lineWidth;
      context.strokeStyle = this.strokeStyle;
      context.shadowColor = this.strokeStyle;
      context.shadowBlur = this.shadowBlur || 2;

      context.beginPath();
      context.arc(this.centerX, this.centerY, this.radius, this.startAngle, this.endAngle, false);
      context.stroke();
      context.restore();

      context.save();
      context.fillStyle = this.strokeStyle;
      context.font = "15px sans-serif";
      if (this.startLabel) {
        var x = this.startLabel.indexOf('澳门') !== -1 ? this.startX - 20 : this.startX;
        var y = this.startLabel.indexOf('澳门') !== -1 ? this.startY + 25 : this.startY;
        context.fillText(this.startLabel, x, y);
      }
      if (this.endLabel) {
        var x = this.endLabel.indexOf('澳门') !== -1 ? this.endX - 20 : this.endX;
        var y = this.endLabel.indexOf('澳门') !== -1 ? this.endY + 25 : this.endY;
        context.fillText(this.endLabel, x, y);
      }
      context.restore();
    };

    return A;
  })();

  var Pulse = (function() {
    function P(options) {
      this.x = options.x;
      this.y = options.y;
      this.maxRadius = options.radius;
      this.color = options.color;
      this.shadowBlur = 5;
      this.lineWidth = options.borderWidth;
      this.r = 0;
      this.factor = 2 / options.radius;
    };

    P.prototype.draw = function(context) {
      // var vr = (this.maxRadius - this.r) * this.factor;
      var vr = 0.5;
      this.r += vr;
      // this.shadowBlur = Math.floor(this.r);

      context.save();
      context.translate(this.x, this.y);
      var strokeColor = this.color;
      strokeColor = utils.calculateColor(strokeColor, 1 - this.r / this.maxRadius);
      context.strokeStyle = strokeColor;
      context.shadowBlur = this.shadowBlur;
      context.shadowColor = strokeColor;
      context.lineWidth = this.lineWidth;
      context.beginPath();
      context.arc(0, 0, this.r, 0, Math.PI * 2, false);
      context.stroke();
      context.restore();

      if (Math.abs(this.maxRadius - this.r) < 0.8) {
        this.r = 0;
      }
    }

    return P;
  })();

  var Spark = (function() {
    var S = function(options) {
      var startX = options.startX,
      startY = options.startY,
      endX = options.endX,
      endY = options.endY;

      //两点之间的圆有多个，通过两点及半径便可以定出两个圆，根据需要选取其中一个圆
      var L = Math.sqrt(Math.pow(startX - endX, 2) + Math.pow(startY - endY, 2));
      var m = (startX + endX) / 2; // 横轴中点
      var n = (startY + endY) / 2; // 纵轴中点
      var factor = 1.5;

      var centerX = (startY - endY) * factor + m;
      var centerY = (endX - startX) * factor + n;

      var radius = Math.sqrt(Math.pow(L / 2, 2) + Math.pow(L * factor, 2));
      var startAngle = Math.atan2(startY - centerY, startX - centerX);
      var endAngle = Math.atan2(endY - centerY, endX - centerX);

      // 保证Spark的弧度不超过Math.PI
      if (startAngle * endAngle < 0) {
        if (startAngle < 0) {
          startAngle += Math.PI * 2;
          endAngle += Math.PI * 2;
        } else {
          endAngle += Math.PI * 2;
        }
      }

      this.tailPointsCount = 5; // 拖尾点数
      this.centerX = centerX;
      this.centerY = centerY;
      this.startAngle = startAngle;
      this.endAngle = endAngle;
      this.radius = radius;
      this.lineWidth = options.width || 5;
      this.strokeStyle = options.color || '#000';
      this.factor = 2 / this.radius;
      this.deltaAngle = (80 / Math.min(this.radius, 400)) / this.tailPointsCount;
      this.trailAngle = this.startAngle;
      this.arcAngle = this.startAngle;

      this.animateBlur = true;

      this.marker = new Marker({
        x: 50,
        y:80,
        rotation: 50 * Math.PI / 180,
        style: 'circle',
        color: 'rgb(255, 255, 255)',
        size: 1.5,
        borderWidth: 0,
        borderColor: this.strokeStyle
      });
    };

    S.prototype.drawArc = function(context, strokeColor, lineWidth, startAngle, endAngle) {
      context.save();
      context.lineWidth = lineWidth;
      // context.lineWidth = 5;
      context.strokeStyle = strokeColor;
      context.shadowColor = this.strokeStyle;
      // context.shadowBlur = 5;
      context.lineCap = "round";
      context.beginPath();
      context.arc(this.centerX, this.centerY, this.radius, startAngle, endAngle, false);
      context.stroke();
      context.restore();
    };

    S.prototype.draw = function(context) {
      var endAngle = this.endAngle;
      // 匀速
      var angle = this.trailAngle + (endAngle - this.startAngle) * this.factor;
      var strokeColor = this.strokeStyle;
      if (this.animateBlur) {
        this.arcAngle = angle;
      }
      this.trailAngle = angle;
      strokeColor = utils.calculateColor(strokeColor, 0.1);

      this.drawArc(context, strokeColor, this.lineWidth, this.startAngle, this.arcAngle);

      // 拖尾效果
      var count = this.tailPointsCount;
      for (var i = 0;  i < count; i++) {
        var arcColor = utils.calculateColor(this.strokeStyle, 0.3-0.3/count*i);
        var tailLineWidth = 4;
        if (this.trailAngle - this.deltaAngle * i > this.startAngle)  {
          this.drawArc(context, arcColor,
            tailLineWidth - tailLineWidth / count * i,
            this.trailAngle - this.deltaAngle * i,
            this.trailAngle
          );
        }

      }

      context.save();
      context.translate(this.centerX, this.centerY);
      this.marker.x = Math.cos(this.trailAngle) * this.radius;
      this.marker.y = Math.sin(this.trailAngle) * this.radius;
      this.marker.rotation = this.trailAngle + Math.PI / 2;
      this.marker.draw(context);
      context.restore();

      if ((endAngle - this.trailAngle) * 180 / Math.PI < 0.5) {
        this.trailAngle = this.startAngle;
        this.animateBlur = false;
      }
    };

    return S;
  })();

  /*
   * options:{
     style:
     data:
   }
  */
  var Migration = function(options) {
    // options = {
    //   data: [{
    //     from: [x, y],
    //     to: [x, y],
    //     color: 'rgb()',
    //     value: 8888
    //   }],
    //   context: context
    // };

    this.data = options.data;
    this.store = {
      arcs: [],
      markers: [],
      pulses: [],
      sparks: []
    };
    this.playAnimation = true;
    this.started = false;
    this.context = options.context;

    this.init();
  };

  Migration.prototype.init = function() {
    this.updateData(this.data);
  };
  /*
   * Shape 必须拥有draw方法
  */
  Migration.prototype.add = function(Shape) {

  };
  Migration.prototype.remove = function() {

  };
  Migration.prototype.clear = function() {
    this.store = {
      arcs: [],
      markers: [],
      pulses: [],
      sparks: []
    };
    // 更新状态
    this.playAnimation = true;
    this.started = false;
    // 清除绘画实例，如果没有这个方法，多次调用start，相当于存在多个动画队列同时进行
    window.cancelAnimationFrame(this.requestAnimationId);
  };
  /*
   * 更新数据
  */
  Migration.prototype.updateData = function(data) {
    if (!data || data.length === 0) {
      return;
    }
    this.clear();
    this.data = data;
    if (this.data && this.data.length > 0) {
      arrayUtils.forEach(this.data, function(element) {
        var arc = new Arc({
          startX: element.from[0],
          startY: element.from[1],
          endX: element.to[0],
          endY: element.to[1],
          labels: element.labels,
          width: 1,
          color: element.color
        });
        var marker = new Marker({
          x: element.to[0],
          y: element.to[1],
          rotation: arc.endAngle + Math.PI / 2,
          style: 'circle',
          color: element.color,
          size: 2,
          borderWidth: 0,
          borderColor: element.color
        });
        var pulse = new Pulse({
          x: element.to[0],
          y: element.to[1],
          // radius: Math.min(Math.max(arc.radius / 10, 20), 30),
          radius: 25,
          color: element.color,
          borderWidth: 3
        });
        var spark = new Spark({
          startX: element.from[0],
          startY: element.from[1],
          endX: element.to[0],
          endY: element.to[1],
          width: 15,
          color: element.color
        });

        this.store.arcs.push(arc);
        this.store.markers.push(marker);
        this.store.pulses.push(pulse);
        this.store.sparks.push(spark);
      }, this);
    }
  };
  /*
  */
  Migration.prototype.start = function(canvas) {
    var that = this;
    if (!this.started) {
      (function drawFrame() {
          that.requestAnimationId = window.requestAnimationFrame(drawFrame, canvas);

          if (that.playAnimation) {
            that.context.clearRect(0, 0, canvas.width, canvas.height);
            for (var p in that.store) {
              var shapes = that.store[p];
              for (var i = 0, len = shapes.length; i < len; i++) {
                shapes[i].draw(that.context);
              }
            }
          }
      })();
      this.started = true;
    }
  };
  Migration.prototype.play = function() {
    this.playAnimation = true;
  };
  Migration.prototype.pause = function() {
    this.playAnimation = false;
  };

  // window.Migration = Migration;
  var QQMapPlugin = window.QQMapPlugin = window.QQMapPlugin || {};

  //声明类,opts为类属性，初始化时传入（非必须，看实际需求）
  var MigrationOverlay = function(map, cfg){
    // options = {
    //   data: [{
    //     from: [lon, lat],
    //     to: [lon, lat],
    //     color: 'rgb()',
    //     value: 8888
    //   }]
    // };
    this.setMap(map);
    this.config = cfg;
    qq.maps.Overlay.call(this);
    this.mapHandles = [];
  };
  //继承Overlay基类
  MigrationOverlay.prototype = new qq.maps.Overlay();
  //实现构造方法
  MigrationOverlay.prototype.construct = function() {
    //将dom添加到覆盖物层
    this.config.canvas = document.createElement('canvas');
    this.getPanes().overlayLayer.appendChild(this.config.canvas);
    this.resize();

    var context = this.config.canvas.getContext('2d');
    if (!this.migration) {
      var data = this.convertData();
      this.migration = new Migration({
        data: data,
        context: context
      });
      this.bindMapEvents();
    }

    this.constructed = true;
    this.draging = false;
  };

  MigrationOverlay.prototype.bindMapEvents = function() {
    var that = this;
    this.mapHandles.push(qq.maps.event.addListener(
        that.map,
        'bounds_changed',
        function () {
            // console.info('bounds_changed');
            that.draw();
        }
    ));
    // autoResize 为false时，改变容器不会触发resize事件；
    // autoResize 为true时，map的resize事件会频繁刷新;
    // 所以这里只监控window的resize事件
    window.onresize = function() {
      that.resize();
    };
    this.mapHandles.push(qq.maps.event.addListener(
        that.map,
        'dragstart',
        function () {
            console.info('map dragstart');
            that.pause();
        }
    ));
    this.mapHandles.push(qq.maps.event.addListener(
        that.map,
        'dragend',
        function () {
            console.info('map dragend');
            that.play();
            that.draw();
        }
    ));
  };

  MigrationOverlay.prototype.resize = function() {
    // 获取map宽高
    var containerStyle = window.getComputedStyle(this.map.getContainer());
    this.config.canvas.style.position = 'absolute';
    this.config.canvas.className = 'migration-overlay';
    this.config.canvas.setAttribute('width', parseInt(containerStyle.width, 10));
    this.config.canvas.setAttribute('height', parseInt(containerStyle.height, 10));

    // this.transform();
  };

  MigrationOverlay.prototype.transform = function() {
    var bounds = this.map.getBounds();
    if (bounds) {
      var topLeft = new qq.maps.LatLng(
          bounds.getNorthEast().getLat(),
          bounds.getSouthWest().getLng()
      );
      var projection = this.getProjection();
      var point = projection.fromLatLngToDivPixel(topLeft);

      // 保证canvas始终叠在左上角而不随map bounds变化而移动
      this.config.canvas.style.transform = 'translate(' +
      Math.round(point.x) + 'px,' +
      Math.round(point.y) + 'px)';
    }
  };

  MigrationOverlay.prototype.convertData = function() {
    var bounds = this.map.getBounds();

    if (this.config && this.config.data && bounds) {
      var topLeft = new qq.maps.LatLng(
          bounds.getNorthEast().getLat(),
          bounds.getSouthWest().getLng()
      );
      var projection = this.getProjection();
      var layerOffset = projection.fromLatLngToDivPixel(topLeft);
      var data = arrayUtils.map(this.config.data, function(d) {
        var fromPixel = projection.fromLatLngToDivPixel(new qq.maps.LatLng(d.from[1], d.from[0]));
        var toPixel = projection.fromLatLngToDivPixel(new qq.maps.LatLng(d.to[1], d.to[0]));
        // overlay 的左上点默认随着地图初始化时的左上边界移动。
        // 为了保证前迁徙动画能够完整画出，所以必须让canvas占据整个地图视图范围。
        // draw中已经移动了canvas overlay的位置，此处需要靠调整偏移来正确绘制迁徙点的位置
        return {
          from: [fromPixel.getX() - layerOffset.x, fromPixel.getY() - layerOffset.y],
          to: [toPixel.getX() - layerOffset.x, toPixel.getY() - layerOffset.y],
          labels: d.labels,
          value: d.value,
          color: d.color
        }
      }, this);

      return data;
    }
  };

  // 更新数据
  MigrationOverlay.prototype.setData = function(data) {
    this.config.data = data;
    this.draw();
  };

  MigrationOverlay.prototype.show = function() {
    this.config.canvas.style.display = "";
  };

  MigrationOverlay.prototype.hide = function() {
    this.config.canvas.style.display = "none";
  };

  MigrationOverlay.prototype.draw = function() {
    var bounds = this.map.getBounds();
    if (bounds && this.migration.playAnimation) {
      this.transform();

      var data = this.convertData();
      this.migration.updateData(data);
      this.migration.start(this.config.canvas);
    }
  };
  MigrationOverlay.prototype.pause = function() {
    this.migration.pause();
  };
  MigrationOverlay.prototype.play = function() {
    this.migration.play();
  };
  //实现析构方法（类生命周期结束时会自动调用，用于释放资源等）
  MigrationOverlay.prototype.destroy = function() {
    this.migration.clear();
    //移除dom
    this.config.canvas.parentNode.removeChild(this.config.canvas);
    // if (this.changeHandler) {
    //   qq.maps.event.removeListener(this.changeHandler);
    //   this.changeHandler = null;
    // }
    arrayUtils.forEach(this.mapHandles, function(handle) {
      qq.mpas.event.removeListener(handle);
    });
    this.mapHandles = [];
  };

  QQMapPlugin["MigrationOverlay"] = MigrationOverlay;

  if (!window) {
    module.exports = MigrationOverlay;
  }
})();

},{}],10:[function(require,module,exports){
function CircleArc(options){
	if(!options || !options.context){
		return {};
	}

	this.context = options.context;

	this.style = options.style || this.style;

	this.init();

}

CircleArc.prototype = {
	constructor: CircleArc,

	style: {
        lineWidth: 1,            
        lineColor: 'rgba(120, 180, 0, .8)',
	},

	init: function(){},
	
	setArc: function(arc){
		this.arc = arc;
	},

	draw: function(){
		var context = this.context;
		var arc = this.arc;
		
	    context.beginPath();	    
	    context.strokeStyle = this.style.lineColor;	    
	    context.lineWidth = this.style.lineWidth;
	    context.arc(arc.x, arc.y, arc.radius, arc.startAngle, arc.endAngle, false);  
	    context.stroke();  
	}
	/** 
	//【勿删】用于辅助测试点击弧线事件
	,drawSegments: function(){			
		var ctx = this.context;
		var segments = this.arc.segments;

        ctx.beginPath();
        ctx.lineWidth="1";
        ctx.strokeStyle="green"; // 红色路径
        for(var i=0,l=segments.length-1; i<l; i++){
            var p1 = segments[i];
            var p2 = segments[i+1];
            ctx.moveTo(p1.x,p1.y);
            ctx.lineTo(p2.x,p2.y);
        }
        ctx.stroke(); // 进行绘制
	}
	*/
}

module.exports = CircleArc;
},{}],11:[function(require,module,exports){
var Util = require('../core/Util.js');

function Pulse(options){
	if(!options || !options.context){
		return {};
	}

	this.context = options.context;

	this.style = options.style || this.style;

	this.init();
}

Pulse.prototype = {

	constructor: Pulse,

	pathSpeed: 1, //px/frame（像素/帧）

	arcLength: 0, //弧线长度，单位px

	tailLength: 80, //圆点尾巴的长度px;

	tailPointsCount: 30,//圆点尾巴由多少个半透明圆点组成;

	pointRadius: 2.5,//px;组成圆点尾巴的半透明圆点的半径;

	style: {
		tailColor: 'rgba(120, 180, 0, .8)'
	},

	init: function(){
		this.getTailPointColor = Util.buildColorCreator(this.style.tailColor);
	},
	
	setArc: function(arc){
		this.arc = arc;
		this.pointAngle = this.pointAngle || this.arc.startAngle;
		this.angleSpeed = this.pathSpeed/this.arc.radius;

		this.arcLength = 2 * arc.radius * (Math.abs(arc.endAngle - arc.startAngle));
		if(this.arcLength<240){
			this.tailLength = this.arcLength/3;
		}
		this.tailPointDeltaAngle = (this.tailLength/this.arc.radius)/this.tailPointsCount;
	},

	draw: function(){
	    var arc = this.arc;

	    //draw moving point
	    this.pointAngle += this.angleSpeed;
	    this.pointAngle = Math.max(this.pointAngle, arc.startAngle);

	    if(this.pointAngle > arc.endAngle){
	    	this.pointAngle = arc.startAngle;
	    }

	    for(var i= 0, l= this.tailPointsCount; i< l; i++){
	    	this.drawArcPoint(
	    		arc,
	    		this.getTailPointColor(0.5-0.5/l*i), 
	    		this.pointAngle- this.tailPointDeltaAngle * i
    		);
	    }    
	},

	drawArcPoint: function(arc, color, angle){
		if(angle<arc.startAngle || angle>arc.endAngle){
			return;
		}
		var context = this.context;
		context.beginPath();
		context.strokeStyle = color;
	    context.lineWidth = 2 * this.pointRadius;
        context.lineCap = "round";
        // context.lineCap = "square";
		context.arc(arc.x, arc.y, arc.radius, angle - 0.001, angle, false);
	    context.stroke();
	},

	toString: function(){
		return [this.startX, this.startY, this.destX, this.destY].join(',');
	}
}

module.exports = Pulse;


},{"../core/Util.js":20}],12:[function(require,module,exports){

var Util = require('../core/Util.js');

var headCanvas;

function createHeadCanvas(color){
	if(headCanvas){
		return;
	}

	var canvas = document.createElement("canvas");
	var context = canvas.getContext("2d");
	var r = 2;
    canvas.width = 2*r;
    canvas.height = 2*r;
	
    context.fillStyle = color;		
	context.lineWidth = 0;
	context.beginPath();
    context.arc(r, r, r, 0, 2*Math.PI, false);
	context.closePath();
	context.fill();

    headCanvas = canvas;
}


function PulseHead(options){
	if(!options || !options.context){
		return {};
	}

	this.context = options.context;

	this.style = options.style || this.style;

	this.init();
}


PulseHead.prototype = {

	constructor: PulseHead,

	pathSpeed: 1, //px/frame（像素/帧）

	tailLength: 80, //px;

	tailPointsCount: 30,

	radius: 2,//px

	style: {
		highlightColor: 'rgba(255, 255, 255, .9)'
	},

	init: function(){},
	
	setArc: function(arc){
		this.arc = arc;
		this.pointAngle = this.pointAngle || this.arc.startAngle;
		this.angleSpeed = this.pathSpeed/this.arc.radius;
	},

	draw: function(){
	    var arc = this.arc;

	    //draw moving point
	    this.pointAngle += this.angleSpeed;
	    this.pointAngle = Math.max(this.pointAngle, arc.startAngle);

	    if(this.pointAngle > arc.endAngle){
	    	this.pointAngle = arc.startAngle;
	    }

	    headCanvas || createHeadCanvas(this.style.highlightColor);

	    this.drawHeadPoint(arc, this.pointAngle);
	},

	drawHeadPoint: function(arc, angle){
		if(angle<arc.startAngle || angle>arc.endAngle){
			return;
		}	
	    var x = arc.x + arc.radius * Math.sin(Math.PI * 0.5 + angle);
	    var y = arc.y - arc.radius * Math.cos(Math.PI * 0.5 + angle);

	    this.context.drawImage(headCanvas, x-this.radius, y-this.radius);
	}
}

module.exports = PulseHead;


},{"../core/Util.js":20}],13:[function(require,module,exports){

var Util = require('../core/Util.js');

var panCanvas;

var createPanCanvas = function(color, maxR, speed){
	if(panCanvas){
		return;
	}

	var canvas = document.createElement("canvas");
	var context = canvas.getContext("2d");
	var getColor = Util.buildColorCreator(color);
	var time = 60;

	maxR = maxR || 20;
	speed = maxR/time; // pix/frame


    canvas.width = 2*maxR;
    canvas.height = 2*maxR;

	var minR = 1, r = minR;
	var lineWidth = 2;
	var opacity = 0.8;
	
	anima()
	
	var firstExtends = true;


	function anima(){
		requestAnimationFrame(function(){
			clear(context);
			if(r>maxR-lineWidth){
				firstExtends = false;
				r = minR;
			}else{
				r += speed;
			}	
			drawRing(maxR, maxR, r, color, opacity, lineWidth);
			if(!firstExtends){
				drawRing(maxR, maxR, maxR - lineWidth, color, opacity - opacity*2 * r/maxR, lineWidth);
			}
			anima();
		});

	}

	function clear(context){
		context.clearRect(0, 0, context.canvas.width, context.canvas.height); 
	}

	function drawRing(x, y, r, color, opacity, lineWidth){
		context.beginPath();
		context.strokeStyle = getColor(opacity);

	    context.lineWidth = lineWidth;
		context.arc(x, y, r, 0, 2 * Math.PI);
		context.closePath();
	    context.stroke();
	}

    panCanvas = canvas;
};


function PulseRing(options){
	if(!options || !options.context){
		return {};
	}

	this.context = options.context;

	this.radius = options.radius || this.radius; 
	this.style = options.style || this.style;
}

PulseRing.prototype = {

	postion: null, //{x,y} screen coordinate system, pix

	radius: 20, // default

	speed: 0.5, //半径的增加速度，px/frame

	style: {
		panColor: 'rgba(120, 180, 0, .8)',
	},

	constructor: PulseRing,

	draw: function(){
		panCanvas || createPanCanvas(this.style.panColor, this.radius, this.speed);
		this.context.drawImage(panCanvas, this.postion.x, this.postion.y);
	},

	setPosition: function(x, y){
		this.postion = {x:x- this.radius, y:y- this.radius};
	}
};

module.exports = PulseRing;

},{"../core/Util.js":20}],14:[function(require,module,exports){

var Util = require('../core/Util.js');
var Animation = require('../core/Animation.js');
var geo = require('../core/geo.js');
var TextLabel = require('../core/TextLabel.js');
var Pulse = require('./Pulse.js');
var PulseHead = require('./PulseHead.js');
var PulseRing = require('./PulseRing.js');
var CircleArc = require('./CircleArc.js');


function Radiation (option){
    if(!option){
        return;
    }

    Animation.call(this, option);

    this.events = {
        onPointClick: option.onPointClick,
        onLineClick: option.onLineClick
    };

    this.addListener();
}

Radiation.prototype = new Animation();

/** @constructor */
Radiation.prototype.construct = Radiation;

Radiation.prototype.animated = true;

/**
 * @override
 */
Radiation.prototype.parseStyle=function(style){
    var defaultStyle = {
        lineWidth: 1,
        
        lineColor: 'rgba(120, 180, 0, .8)',
        
        highlightColor: 'rgba(255, 255, 255, .8)',

        tailColor: 'rgba(120, 180, 0, .8)',

        panColor: 'rgba(120, 180, 0, .8)',

        textColor: 'rgba(120, 180, 0, .8)',

        textSize: '12px',

        textFont: '微软雅黑',

        maxRadius: 30,

        minRadius: 3 //private
    };

    style.maxRadius = style.radius;

    if(style){   
        for(var i in style){
            if(i in defaultStyle && style[i]){
                if(i.toLocaleLowerCase().indexOf('color')>-1){
                    defaultStyle[i] = Util.any2rgba(style[i]);
                }else{
                    defaultStyle[i] = style[i];   
                }
            }
        }
    }
    
    return defaultStyle;
};


/**
 * @override
 * @private
 *
 */
Radiation.prototype.buildDataAndShapes = function(data){
    this.shapeGroups = this.prepareData(data);
    this.scene.setShapes(this.createShapes(this.shapeGroups));
    this.viewChangeHandler();
    this.scene.play();
};

/*
 * 初始化数据,创建canvas中的图形对象
 * @private
 */
Radiation.prototype.prepareData = function(data){
    var dPoints = data.points, 
        links = data.links;

    var fromLatlng, toLatlng;
    var context = this.context, style = this.style;
    var fromName, fromLabels = {};
    var fromPoints = {}, toPoints = {};
    var option = {context: context, style: style};
    var radius = this.style.radius || this.style.maxRadius;
    var points = [];

    var allPoints = {};

    for(var i=0, link; link=links[i++];){
        var fid = link.from.id, tid = link.to.id;
        var fPoint = dPoints[fid], tPoint = dPoints[tid];

        if(!(fid in allPoints)){
            allPoints[fid] = {
                id: fid,
                latlng: [fPoint.lat, fPoint.lng],
                text: link.from.name || fid
            }
        }

        if(!(tid in allPoints)){
            allPoints[tid] = {
                id: tid,
                latlng:  [tPoint.lat, tPoint.lng],
                text:  link.to.name || tid
            }
        }
    }

    for(var i in allPoints){
        var p = allPoints[i];

        p.latlng = new qq.maps.LatLng(p.latlng[0], p.latlng[1]);
        p.pan = new PulseRing(Util.extend({radius: radius}, option));
        p.label = new TextLabel(Util.extend({text: p.text}, option));
        points.push(p);
    }

    for(var i=0, link; link=links[i++];){
        fromLatlng = dPoints[link.from.id];
        toLatlng = dPoints[link.to.id];
        link.from.latlng = new qq.maps.LatLng(fromLatlng.lat, fromLatlng.lng);
        link.to.latlng = new qq.maps.LatLng(toLatlng.lat, toLatlng.lng);
        link.pulse = new Pulse({context: context, style: style});
        
        link.pulseHead = new PulseHead({context: context, style: style});
        link.circleArc = new CircleArc({context: context, style: style});
    }

    return {points:points, links: links};
}

/*
 * 
 * @private
 */
Radiation.prototype.createShapes = function(groups){
    var points = groups.points, 
        links = groups.links;

    var shapes = [], link;

    for(var i in points){
        shapes.push(points[i].pan);
        shapes.push(points[i].label);
    }        

    var pointsSize = shapes.length;

    for(var i=0, l=links.length; i<l; i++){
        link=links[i];

        shapes[pointsSize+ i] = link.circleArc;
        shapes[pointsSize+ i + l ] = link.pulse;
        shapes[pointsSize+ i + 2*l ] = link.pulseHead;
    }

    return shapes;
}


/**
 * 视野变化时canvas中的图形对象的变化逻辑
 * @override
 */
Radiation.prototype.viewChangeHandler = function(){
    var points = this.shapeGroups.points;
    var links = this.shapeGroups.links;
    var style = this.style;
    var proj = this.getProjection();//map创建之前得不到proj
    var fxy, txy, arc;

    for(var i in points){       
        var p = points[i];
        var xy = proj.fromLatLngToContainerPixel(p.latlng);
        p.pan.setPosition(xy.x, xy.y);
        p.label.setPosition(xy.x + (p.radius || 10), xy.y + parseInt(style.textSize)/2);
        p.bounds = geo.getBounds(xy, 40);   
    }

    for(var i=0, link; link=links[i++];){
        fxy = proj.fromLatLngToContainerPixel(link.from.latlng);
        txy = proj.fromLatLngToContainerPixel(link.to.latlng);
        arc = geo.calculateArc(fxy.x, fxy.y, txy.x, txy.y);
        link.pulse.setArc(arc);
        link.pulseHead.setArc(arc);            
        link.circleArc.setArc(arc);
    }
};

/**
 * attach click event listener
 * 优先响应pointClick 事件
 * @private
 */
Radiation.prototype.addListener = function(){

    var onPointClick = this.events.onPointClick;
    var onLineClick = this.events.onLineClick;
    
    qq.maps.event.addListener(this.map, 'click', function(e){

        var pixPosition = e.pixel; 

        //监听pointClick事件
        if(typeof onPointClick == 'function'){
            var points = this.shapeGroups.points;

            for(var i=0, points; p=points[i++];){
                if(p.bounds && geo.inBounds(pixPosition, p.bounds)){
                    onPointClick({
                        id: p.id,
                        text: p.text,
                        latlng: p.latlng,
                    });

                    return;
                }
            }
        }

        //监听lineClick事件
        if(typeof onLineClick == 'function'){
            //click位置与某个线段的距离小于buffer则认为点击到了这个线段所在的弧线
            var buffer = 10, 
                links = this.shapeGroups.links;

            for(var i=0, link; link=links[i++];){
                var sgs = link.circleArc.arc.segments;
                for(var j=0, l=sgs.length; j<l-1;j++){
                    var d = geo.pointToLine(sgs[j], sgs[j+1], pixPosition);
                    if(d < buffer){
                        onLineClick({
                            from:{
                                id: link.from.id,
                                latlng: link.from.latlng
                            },
                            to:{
                                id: link.to.id,
                                latlng: link.to.latlng
                            }
                        });

                        return;
                    }
                }
            }
        }
    }.bind(this));
}

module.exports = Radiation;

},{"../core/Animation.js":17,"../core/TextLabel.js":19,"../core/Util.js":20,"../core/geo.js":21,"./CircleArc.js":10,"./Pulse.js":11,"./PulseHead.js":12,"./PulseRing.js":13}],15:[function(require,module,exports){

var Util = require('../core/Util.js');

function Cell(options){
    if(!options || !options.context){
        return {};
    }

    this.context = options.context;

    this.data = options.data || {};

    this.setBounds(options.bounds || this.bounds);

    this.color = this.data.color || 'rgba(255,255,255, 0.0)';


}

Cell.prototype = {
    constructor: Cell,
    
    bounds: {},//{lb, rt},左下角坐标和右上角坐标

    visibility: true,


    draw: function(){
        var ctx = this.context,
            bounds = this.bounds,
            x = bounds.x,
            y = bounds.y,
            w = bounds.w,//加了0.1是因为网格之间有空隙，不是最好的解决方案
            h = bounds.h
        ;


        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.color;
        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);
    },

    setBounds: function(bounds){
        this.bounds = bounds;
    },
    
    setColor: function(color){
        this.style.fillColor = color;
    }
};

module.exports = Cell;

},{"../core/Util.js":20}],16:[function(require,module,exports){

var Util = require('../core/Util.js');
var Animation = require('../core/Animation.js');
var geo = require('../core/geo.js');

var Cell = require('./Cell.js');


function TrafficCircle (option){
    if(!option){
        return {};
    }
    Animation.call(this, option);

}

TrafficCircle.prototype = new Animation();

TrafficCircle.prototype.construct = TrafficCircle;

TrafficCircle.prototype.buildDataAndShapes = function(data){
    this.data = data;

    this.shapes = this.createShapes(data);

    this.scene.setShapes(this.shapes);

    this.viewChangeHandler();
    
    this.scene.render();
};

TrafficCircle.prototype.createShapes = function(data){
    var ctx = this.context;
    var shapes = [];

    for(var i=0, d; d = data[i++]; ){
        shapes.push(new Cell({
            context: ctx, 
            data: d,
            bounds: this.latLngToPixBounds(d.lat, d.lng, d.size, d.size)
        }));
    }

    return shapes;
}

TrafficCircle.prototype.viewChangeHandler = function(){
    var shapes = this.shapes;
    var d;
    
    //待优化：只计算和渲染视野内的shapes
    for(var i=0, shape; shape = shapes[i++]; ){
        d = shape.data;
        shape.setBounds(this.latLngToPixBounds(d.lat, d.lng, d.size, d.size))
    }    
    
    this.scene.setShapes(shapes);
}

/**
 * 根据一个方块的中心点经纬度坐标和宽高（经纬度步长）计算这个方块的屏幕像素bounds(左上角xy和width,height)
 */
TrafficCircle.prototype.latLngToPixBounds = function(lat, lng, height, width){
    var proj = this.getProjection();
    var leftTopPix = proj.fromLatLngToContainerPixel(new qq.maps.LatLng(lat + height/ 2, lng - width/ 2));
    var rightBottomPix = proj.fromLatLngToContainerPixel(new qq.maps.LatLng(lat - height/ 2, lng + width/ 2));

    return {
        x: leftTopPix.x,
        y: leftTopPix.y,
        w: rightBottomPix.x - leftTopPix.x,
        h: rightBottomPix.y - leftTopPix.y
    }
}


module.exports = TrafficCircle;

},{"../core/Animation.js":17,"../core/Util.js":20,"../core/geo.js":21,"./Cell.js":15}],17:[function(require,module,exports){

var Scene = require('./Scene.js');
var qmap =  require('./map.js');


var containerClassName = 'c'+Math.random().toString(36).substr(2);
var styleElement = document.createElement('style');
styleElement.innerHTML = ['.',containerClassName,'{position:absolute}'].join('');
document.head.appendChild(styleElement);




function Animation(option){
    option = option || {};
    
    if(!option.map){
        return;
    }

    // var map = qmap.createMap(option.map);
    var map = option.map;
    /*
     * 地图bounds_changed时是否需要执行canvas位置对地图窗口的fix
     *
     */
    this.fixFlag = true;

    /*
     * 地图当前是否正在缩放
     *
     */
    this.zoomChanging = false;

    /*
     * 是否在地图视野变化时自动重绘和resize，默认为true
     * 若设置为false，则只有在setData时会重绘和resize
     */
    this.autoRender = ('autoRender' in option)? option.autoRender: true;

    this.transform = Animation.getTransformKey();

    /** 
     * 交互事件 
     * @abstract 
     */
    this.events = {};

    this.setMap(map || null);   

    //初始化场景
    this.setupStage();


    //构建样式对象
    this.style = this.parseStyle(option.style||this.style);

    this.opacity = option.opacity || 1;

    //构建数据对象
    if(option.data) {
        //setData方法中也会监听地图的idle事件执行一次初始化，需要在createDoms执行之后执行
        this.setData(option.data);
    }

    this.mapStatus = {
        zooming: false,
        moving: false,
        idle: true
    }

};

Animation.prototype = new qq.maps.Overlay();

/** @constructor */
Animation.prototype.construct = Animation;

/* 
 * init anything you need 
 * @abstract
 */
Animation.prototype.init = function(){};

/* 
 * 视野变化时的回调函数 
 * @abstract
 */
Animation.prototype.viewChangeHandler = function(){};

/** 
 * set data 
 * @abstract
 */
Animation.prototype.buildDataAndShapes = function(data){}

/** 
 * set style 
 * @abstract
 */
Animation.prototype.parseStyle = function(style){return style;};

/** 
 * 设置渲染数据并重新渲染
 * @public
 */
Animation.prototype.setData = function(data, cb){
    if(!this.autoRender){
        this.resize();
    }

    if(this.mapLoaded){
        this.buildDataAndShapes(data, cb);
    }else{            
        qq.maps.event.addListenerOnce(this.map, "idle", function () {
            this.buildDataAndShapes(data, cb);
        }.bind(this));
    }
};


/** 
 * 初始化场景 
 * @private
 */
Animation.prototype.setupStage = function(){
    this.mapDiv = this.map.getContainer();

    this.scene = new Scene();

    // console.info('animated',this.animated);
    //document.getElementById("canvasId")

    qq.maps.event.addListenerOnce(this.map, "idle", function () {
        this.mapLoaded = true;    

        if(this.map){
            //create canvas 
            this.createDoms();                    

            if(this.autoRender){
                this.resize();     
            }

            this.addMapStatusListeners();
            
            if(this.autoRender){

                this.addFixListeners();
                
                if(this.animated){
                    this.addAnimatedListeners();
                }else{
                    this.addStaticListeners();
                }

            }
            this.scene.setContext(this.context);
            
            this.init();
        }

    }.bind(this));
}

/** 
 * 创建容器canvas
 * @private
 */
Animation.prototype.createDoms = function(){   
    var container = this.container = document.createElement('div');
    var canvas = this.canvas = document.createElement('canvas');

    canvas.style.opacity = this.opacity;

    container.className = containerClassName+" emily";
    canvas.id = "canvasId";
    this.context= canvas.getContext('2d');
    this.container.appendChild(canvas);
    this.getPanes().overlayLayer.appendChild(container);
};

Animation.prototype.addMapStatusListeners = function(){
    var mapStatus = this.mapStatus;

    qq.maps.event.addListener(this.map, "zoom_changed", function(){
        mapStatus.zooming = true;
    }.bind(this));

    qq.maps.event.addListener(this.map, "center_changed", function(){
        mapStatus.moving = true;
    }.bind(this));

    qq.maps.event.addListener(this.map, "idle", function(){
        mapStatus.zooming = false;
        mapStatus.moving = false;
        mapStatus.idle = true;
    }.bind(this));
}

//canvas fix 
Animation.prototype.addFixListeners = function(){     
    qq.maps.event.addListener(this.map, "idle", function(){  
        this.resize.bind(this)();
    }.bind(this));
};


/**
 * 
 * 动画图层的重绘方案
 *
 * 事件触发的顺序：window.resize -> zoom_changed -> center_changed -> bounds_changed -> idle
 * 在数据量较大的情况下，平移地图时，canvas会漂。
 * 为了解决这个问题，平移(center_changed)地图时停止动画，也停止canvas位置对地图窗口的fix，平移结束后再继续动画和fix。
 * 缩放时不会有漂的问题。
 *
 * 监听bounds_changed事件，判断是否正在缩放，
 * 若直接监听zoom_changed事件，在缩放时就不显示图层，原因尚不明。
 *
 * @private
 */
Animation.prototype.addAnimatedListeners = function(){
    var mapStatus = this.mapStatus;

    qq.maps.event.addListener(this.map, "idle", function(){
        this.viewChangeHandler.bind(this)();       
        this.scene.play();
    }.bind(this));

    qq.maps.event.addListener(this.map, 'bounds_changed', function(){ 
        if(mapStatus.zooming){
            this.reposition();//防止zoom后图层抖动一下
            this.viewChangeHandler.bind(this)();
        }else{
            this.scene.stop();
        }
    }.bind(this));
};

/**
 * 静态图层的重绘方案
 *
 * @private
 */
Animation.prototype.addStaticListeners = function(){
    var mapStatus = this.mapStatus;

    qq.maps.event.addListener(this.map, "idle", function(){
        var s = Date.now();

        this.viewChangeHandler.bind(this)();  
        var c =  Date.now();

        this.scene.render();

        // console.info('frame:', c-s,',', Date.now()-c);
    }.bind(this));

    qq.maps.event.addListener(this.map, 'bounds_changed', function(){ 
        if(mapStatus.zooming){

            this.reposition();//防止zoom后图层抖动一下
            var s = Date.now();

            this.viewChangeHandler.bind(this)();  
            var c =  Date.now();
            this.scene.render();
            // console.info('[frame] zoom:', this.map.getZoom(),'time:', (Date.now()-s));
            // console.info('[frame] ','viewChangeHandler:', c-s,',scene.render:', Date.now()-c);
        }
    }.bind(this));
}

/**
 * 重新计算canvas位置，与map容器一致
 * @private
 */
Animation.prototype.reposition = function(){
    var bounds = this.map.getBounds();
    var topLeft = new qq.maps.LatLng(
        bounds.getNorthEast().getLat(),
        bounds.getSouthWest().getLng()
    );

    var projection = this.getProjection();
    var point = projection.fromLatLngToDivPixel(topLeft);
    this.container.style[this.transform] = 'translate(' + Math.round(point.x) + 'px,' + Math.round(point.y) + 'px)';
};


/**
 * 重新计算canvas尺寸，与map容器一致
 * @private
 */
Animation.prototype.resize = function(){
    var w = this.mapDiv.clientWidth;
    var h = this.mapDiv.clientHeight;

    this.container.style.cssText = 'width:' + w + 'px;height:' + h + 'px;';
    this.canvas.width = w;
    this.canvas.height = h;

    //resize 后立即调整容器位置，不然画面会出现剧烈抖动。
    this.reposition();
};    

/**
 * 工具方法，只使用一次
 * @private
 * @static
 */
Animation.getTransformKey = function(){
    var div = document.createElement('div');
    var props = [
        'transform',
        'WebkitTransform',
        'MozTransform',
        'OTransform',
        'msTransform'
    ];

    for (var i = 0; i < props.length; i++) {
        var prop = props[i];
        if (div.style[prop] !== undefined) {
            return prop;
        }
    }

    return props[0];
};

if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = (function() {
        return window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function(callback, element) {
                window.setTimeout(callback, 1000 / 60);
        };
    })();
}

module.exports = Animation;

},{"./Scene.js":18,"./map.js":22}],18:[function(require,module,exports){
function Scene(options) {
    options = options || {};

    if(options.context){
        this.setContext(options.context);
    }       
    
    this.playFlag = false; // 播放标识，初始为false
    this.shapes = [];
};

var drawFlag = 0;

Scene.prototype = {
    constructor: Scene,
    
    setContext: function(context){
        this.context = context; 
        this.updateSize();
    },
    
    render: function() {
        var shapes = this.shapes;

        //clear prev frame
        this.clearCanvas(); 


        //render current frame

        // var s = Date.now();

        var i = 0, 
            shape            
        ;
        while(shape = shapes[i++]){
            // if(shape.visible){
                shape.draw();
            // }
        }
        // console.info('render time:', Date.now()-s);
    },

    animate: function(){
        if(!this.playFlag){
            return;
        }

        this.render();

        if (this.playFlag) {
            requestAnimationFrame(this.animate.bind(this));
        }
    },

    play: function() {
        if (!this.playFlag) {
            this.playFlag = true;
            this.animate();
        }
    },

    stop: function() {
        this.playFlag = false;
    },
    
    clearCanvas: function(){
        var buffer = 200;
        this.context.clearRect(-buffer, -buffer, this.width + buffer, this.height + buffer); 
    },

    updateSize: function(){
        var canvas = this.context.canvas;
        this.width = canvas.width; //画布宽
        this.height = canvas.height; // 画布高
    },

    add: function(shape) {
        this.shapes.push(shape);
    },

    remove: function(id){
        var index = this.getIndexOfShapes(id);
        if(index >= 0){
            this.shapes.splice(index,1);
        }
    },

    get: function(index) {
        return this.shapes[index];
    },

    getById: function(id){
        for(var key in this.shapes){
            if(this.shapes[key].id = id){
                return this.shapes[key];
            }
        }
    },

    getAll: function(){
        return this.shapes;
    },

    setShapes: function(shapes){
        // console.info(this.shapes)
        this.shapes = shapes;
    },

    setClick: function(id){
        var index = this.getIndexOfShapes(id);
        if(index >= 0){
            this.shapes[index].setClick = true;
        }
    },

    setMouseover: function(id){
        var index = this.getIndexOfShapes(id);
        if(index >= 0){
            this.shapes[index].setMouseover = true;
        }
    },

    setMouseout: function(id){
        var index = this.getIndexOfShapes(id);
        if(index >= 0){
            this.shapes[index].setMouseout = true;
        }
    },

    setOptions:function(polygon){
        var index = this.getIndexOfShapes(polygon.id);
        if(index >= 0){
            this.shapes[index].style = polygon.style;
            this.shapes[index].clickable = polygon.clickable;
            this.shapes[index].map = polygon.map;
        }
    }
};

Scene.prototype.getIndexOfShapes = function(id){
    var index = -1;
    var shapes = this.shapes;
    for(var i = 0; i< shapes.length; i++){
        if(shapes[i].id == id){
            index = i;
        }
    }
    return index;
}

module.exports = Scene;
},{}],19:[function(require,module,exports){
var Util = require('../core/Util.js');

function TextLabel(options){
	if(!options || !options.context){
		return {};
	}
	this.context = options.context;

	this.text = options.text;

	this.style = options.style || this.style;

	this.init();
}

TextLabel.prototype = {

	visible: true, 

	position: {x:0, y:0},

	style: {
        textColor: 'rgba(120, 180, 0, 1)',

        font: '12px 微软雅黑'
	},

	constructor: TextLabel,

	init: function(){
		this.font = this.style.font || (this.style.textSize + ' ' +this.style.textFont);
	},

	draw: function(){
		if(this.visible){
			var pos = this.position; 
			this.write(pos.x, pos.y, this.style.textColor, this.font, this.text);
		}
	},

	write: function(x, y, color, font, text){
		var context = this.context;	    

		context.fillStyle = color;		
		context.lineWidth = 1;
		context.font=font;
		context.fillText(text, x, y);	
	},

	setPosition: function(x, y){
		this.position = {x:x, y:y}
	},

	show: function(){
		this.visible = true;
		return this;
	},

	hide: function(){
		this.visible = false;
		return this;
	}

};

module.exports = TextLabel;

},{"../core/Util.js":20}],20:[function(require,module,exports){

module.exports = {
    extend: function(child, parent, parent2){
        for(var i in parent){
            if(parent.hasOwnProperty(i)){
                child[i] = parent[i];
            }
        }

        if(parent2){
		   	for(var i in parent2){
	            if(parent2.hasOwnProperty(i)){
	                child[i] = parent2[i];
	            }
	        }
        }

        return child;
    },
	any2rgba: function(color, opacity){
		color = color.toLowerCase();

		var reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/;

		opacity = opacity || 1;

		if(color && reg.test(color)){
			return this.hex2rgb(color);
		}else if(color.indexOf('rgba')){
			return color;
		}else if(color.indexOf('rgb')>-1){
			return this.rgb2rgba(color, opacity);
		}
	},

	hex2rgb: function(sColor, opacity){
		var sColor = sColor.toLowerCase();
		if(sColor.length === 4){
			var sColorNew = "#";
			for(var i=1; i<4; i+=1){
				sColorNew += sColor.slice(i,i+1).concat(sColor.slice(i,i+1));	
			}
			sColor = sColorNew;
		}

		var sColorChange = [];
		for(var i=1; i<7; i+=2){
			sColorChange.push(parseInt("0x"+sColor.slice(i,i+2)));	
		}

		return "rgba(" + sColorChange.join(",") + ","+(opacity || 1)+")";		
	},

	rgb2rgba: function(color, opacity){		
		var items = color.replace('rgb(','rgba(').replace(')','').split(/\,|\)/);
		if(items.length==3){
			items.push(opacity || '0.8');
		}

		return items.join(',')+')';
	},

	buildColorCreator: function(color){
		var rgba = this.rgb2rgba(color).replace('rgb(','rgba(').split(',').splice(0,3).join(',')+',';

		return function(opacity){
			return rgba + opacity +')';
		}
	}
}

},{}],21:[function(require,module,exports){
module.exports = {

    ll2mc: function(lnglat) {
        var x = lnglat.lng * 111319.49077777777777777777777778;
        var y = Math.log(Math.tan((90 + lnglat.lat) * 0.0087266462599716478846184538424431)) / 0.017453292519943295769236907684886 * 111319.49077777777777777777777778;
        return {x: x, y: y};
    },

    mc2ll: function(point){
        var lng = point.x / 111319.49077777777777777777777778;
        var lat =Math.atan(Math.exp(point.y / 111319.49077777777777777777777778 * 0.017453292519943295769236907684886)) / 0.0087266462599716478846184538424431 - 90;
        return {lat:lat, lng: lng};
    },
    //计算两点间距离
    distance: function(p1, p2) {
        return Math.sqrt(Math.pow(p1.x-p2.x, 2)+Math.pow(p1.y-p2.y, 2));
    },

    //点到线段的最短距离,x0,y0是圆心
    pointToLine: function(p1, p2, p) {
        var ans = 0;
        var a, b, c;
        a = this.distance(p1, p2);
        b = this.distance(p1, p);
        c = this.distance(p2, p);
        if (c+b==a) {//点在线段上
          ans = 0;
          return ans;
        }
        if (a<=0.00001) {//不是线段，是一个点
          ans = b;
          return ans;
        }
        if (c*c >= a*a + b*b) { //组成直角三角形或钝角三角形，p1为直角或钝角
          ans = b;
          return ans;
        }
        if (b * b >= a * a + c * c) {// 组成直角三角形或钝角三角形，p2为直角或钝角
          ans = c;
          return ans;
        }
        // 组成锐角三角形，则求三角形的高
        var p0 = (a + b + c) / 2;// 半周长
        var s = Math.sqrt(p0 * (p0 - a) * (p0 - b) * (p0 - c));// 海伦公式求面积
        ans = 2*s / a;// 返回点到线的距离（利用三角形面积公式求高）
        return ans;
    },

    //根据起终点坐标得到一条弧线
    calculateArc: function(x1, y1, x2, y2) {
        var x, y;
        var L = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2)); //定值
        var V_AB = [x2 - x1, y2 - y1]; //定值

        var m = (x1 + x2) / 2;
        var n = (y1 + y2) / 2; //定值
        var factor = 1.8; 

        //x, y 为圆心
        x = (y1 - y2) * factor + m;
        y = (x2 - x1) * factor + n;

        var radius = Math.sqrt(Math.pow(L / 2, 2) + Math.pow(L * factor, 2));
        var startAngle = Math.atan2(y1 - y, x1 - x);
        var endAngle = Math.atan2(y2 - y, x2 - x);

        if(startAngle > endAngle){
            endAngle += 2 * Math.PI;
        }


        //把一个弧线转化为折线，返回折线的节点数组
        var segments = (function(){

            //把一个弧线分成num个线段
            //num与半径的开方成正比，否则半径较大时，num会太大，没必要
            var num = Math.max(~~(Math.sqrt(radius)/6), 3);
            var delta = (endAngle - startAngle)/num;

            //已知圆心和半径，求圆上弧度为angle对应的点
            function getPosition(x0, y0, r, angle){
                return {
                    x: x0 + r * Math.sin(Math.PI * 0.5 + angle), 
                    y: y0 - r * Math.cos(Math.PI * 0.5 + angle)
                }
            }

            var a = [{x:x1,y:y1}];
            for(var i=1; i<num; i++){
                a.push(getPosition(x, y, radius,startAngle + i*delta));
            }
            a.push({x:x2,y:y2});

            return a;
        }());


        var arc = {
            x: x,
            y: y,
            radius: radius,
            startAngle: startAngle,
            endAngle: endAngle,
            l: L,
            segments: segments
        }

        return arc;
    },

    //根据中点和边长得到一个bounds
    getBounds: function(center, length){
        return {
            topLeft: {
                x: center.x - length/2, 
                y: center.y - length/2
            },
            bottomRight: {
                x: center.x + length/2, 
                y: center.y + length/2
            }
        }
    },

    //判断点是否在bounds内部
    inBounds: function(point, bounds){
        return point.x >bounds.topLeft.x 
            && point.x < bounds.bottomRight.x
            && point.y > bounds.topLeft.y
            && point.y < bounds.bottomRight.y;
    },

    latlngInBounds: function(p, b){
        return p.lat <=b.max.lat && p.lat >= b.min.lat && p.lng <= b.max.lng && p.lng >= b.min.lng;
    },

    boundsInBounds: function(b1, b2){
        return b1.max.lat <= b2.max.lat && b1.max.lng <= b2.max.lng && b1.min.lat >= b2.min.lat && b1.min.lng >= b2.min.lng;
    },

    getUnionBounds: function(b1, b2){
        if(this.boundsCrossBounds(b1, b2)){
            return {
                max: {
                    lat: Math.min(b1.max.lat, b2.max.lat),
                    lng: Math.min(b1.max.lng, b2.max.lng)
                },
                min: {
                    lat: Math.max(b1.min.lat, b2.min.lat),
                    lng: Math.max(b1.min.lng, b2.min.lng)
                }
            }
        }
        return null;
    },

    boundsCrossBounds: function(b1, b2){
        return !(b1.min.lat > b2.max.lat || b1.max.lat < b2.min.lat || b1.min.lng > b2.max.lng || b1.max.lng < b2.min.lng);
    }
};
},{}],22:[function(require,module,exports){
//option: {container, center,zoom}
module.exports.createMap = function(option){
    return new qq.maps.Map(option.container, option);
}


},{}],23:[function(require,module,exports){
var plugin = qq.maps.plugin = qq.maps.plugin || {};
plugin.createMap = require('./core/map.js').createMap;
// plugin.Density = require('./Density');
 plugin.Radiation = require('./Radiation');
// plugin.Area = require('./Area');

plugin.Heat = require('./Heat');
plugin.Dots = require('./Dots');
plugin.Grid = require('./Grid');
plugin.TrafficCircle = require('./TrafficCircle');
plugin.Migration = require('./Migrate');
// plugin.SinglePolygon = require('./SinglePolygon');
// plugin.Event = require('./Event');
// plugin.CanvasPolygon = require('./CanvasPolygon');
},{"./Dots":4,"./Grid":6,"./Heat":8,"./Migrate":9,"./Radiation":14,"./TrafficCircle":16,"./core/map.js":22}]},{},[23]);
