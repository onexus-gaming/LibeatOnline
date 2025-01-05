const $get = document.querySelectorAll.bind(document);
const $get1 = document.querySelector.bind(document);

let $d = {
	write: function (string) {
		document.innerHTML = string;
	},
	append: function (string) {
		document.innerHTML += string;
	},
	clear: function () {
		document.innerHTML = "";
	},
	new: function(type, string) {
		let element = document.createElement(type);
		element.textContent = string;
		return element;
	},
	spawn: function(element) {
		document.querySelector("body").appendChild(element);
	},
	get body() {
		return $get("body")[0];
	},
    on: function(event, func) {
        document.addEventListener(event, func);
    },
    onLoad: function(func) {
        $d.on("DOMContentLoaded", func);
    },
};

function $memoize(func) {
	let cache = {}

	return function(...values) {
		if(!(values in cache))
			cache[values] = func(...values);
		return cache[values];
	}
}

let $mouse = {
    x: 0,
    y: 0,
	buttons: {},

	LEFT: 0,
	MIDDLE: 1,
	RIGHT: 2,

	isDown: function(button) {
		return (button in $mouse.buttons) && ($mouse.buttons[button]);
	},
};
$d.onLoad(function() {
    $d.on("mousemove", function(event) {
        $mouse.x = event.pageX;
        $mouse.y = event.pageY;
    });

	$d.on("mousedown", function(event) {
		$mouse.buttons[event.button] = true;
	});

	$d.on("mouseup", function(event) {
		$mouse.buttons[event.button] = false;
	});
});

let $keyboard = {
	keys: {},

	isDown: function(key) {
		return (key in $keyboard.keys) && ($keyboard.keys[key]);
	},
};
$d.onLoad(function() {
	$d.on("keydown", function(event) {
		$keyboard.keys[event.code] = true;
	});

	$d.on("keyup", function(event) {
		$keyboard.keys[event.code] = false;
	});
});

let $update = {
	handlers: [],
	rate: 1000,
	lastRender: 0,
	dt: 0,

	get delay() {
		return 1000/this.rate;
	},
	set delay(delay) {
		this.rate = 1000/delay;
	},

	add: function(handler) {
		$update.handlers.push(handler);
		return handler;
	},

	loop: function(timestamp) {
		$update.dt = timestamp - $update.lastRender;

		for(let handler of $update.handlers) {
			handler($update.dt);
		}

		$update.lastRender = timestamp;
		window.requestAnimationFrame($update.loop);
	},
	
	start: function() {
		window.requestAnimationFrame($update.loop);
	},
}

class $object {
    constructor(docObject) {
        this.docObject = docObject;
    }

	static fromID(docObjectID) {
		return new $object($get1("#" + docObjectID));
	}

    get innerText() {
        return this.docObject.innerText;
    }
    set innerText(text) {
        this.docObject.innerText = text;
    }

    get innerHTML() {
        return this.docObject.innerHTML;
    }
    set innerHTML(text) {
        this.docObject.innerHTML = text;
    }

    get x() {
        return this.docObject.offsetLeft;
    }
    set x(value) {
        this.docObject.style.position = "absolute";
        this.docObject.style.left = value + "px";
    }

    get y() {
        return this.docObject.offsetTop;
    }
    set y(value) {
        this.docObject.style.position = "absolute";
        this.docObject.style.top = value + "px";
    }
}

class $canvas {
	constructor(docObject) {
		this.docObject = docObject;
		this.ctx = this.docObject.getContext("2d");
	}
	static fromID(docObjectID) {
		return new $canvas($get1("#" + docObjectID));
	}

	get fillStyle() {
		return this.ctx.fillStyle;
	}
	set fillStyle(style) {
		this.ctx.fillStyle = style;
	}

	get strokeStyle() {
		return this.ctx.strokeStyle;
	}
	set strokeStyle(style) {
		this.ctx.strokeStyle = style;
	}

	get lineWidth() {
		return this.ctx.lineWidth;
	}
	set lineWidth(width) {
		this.ctx.lineWidth = width;
	}

	rect(mode, x, y, w, h) {
		switch(mode) {
			case "fill":
				this.ctx.fillRect(x, y, w, h);
				break;
			case "stroke":
				this.ctx.strokeRect(x, y, w, h);
				break;
			case "clear":
				this.ctx.clearRect(x, y, w, h);
				break;
			default:
				console.error(`Unknown rectangle drawing mode "${mode}".`);
				break;
		}
	}

	clear() {
		this.ctx.clearRect(0, 0, this.docObject.width, this.docObject.height);
	}

	arc(mode, x, y, r, start, end, ccw) {
		this.ctx.arc(x, y, r, start, end, ccw);
		switch(mode) {
			case "fill":
				this.ctx.fill();
			case "stroke":
				this.ctx.stroke();
				break;
			default:
				console.error(`Unknown arc drawing mode "${mode}".`);
				break;
		}
	}

	beginPath() {
		this.ctx.beginPath();
	}

	endPath() {
		this.ctx.endPath();
	}

	moveTo(x, y) {
		this.ctx.moveTo(x, y);
	}

	lineTo(x, y) {
		this.ctx.lineTo(x, y);
	}

	image(image, x, y) {
		this.ctx.drawImage(image, x, y);
	}

	get width() {
		return this.docObject.width;
	}
	set width(w) {
		this.docObject.style.display = "block";
		this.docObject.width = w;
	}

	get height() {
		return this.docObject.width;
	}
	set height(h) {
		this.docObject.style.display = "block";
		this.docObject.height = h;
	}
}

function RGB(r, g, b) {
	return `rgb(${r}, ${g}, ${b})`;
}

function RGBA(r, g, b, a) {
	return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function HSL(h, s, l) {
	return `hsl(${h}, ${s}, ${l})`;
}

function HSLA(r, g, b, a) {
	return `hsla(${h}, ${s}, ${l}, ${a})`;
}