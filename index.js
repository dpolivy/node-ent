var entities = require('./entities.json');

var revEntities = {},
    stringEntities = {};
for (var key in entities) {
    var e = entities[key];
    var s = typeof e === 'number' ? String.fromCharCode(e) : e;
    revEntities[s] = key;
    if (typeof e === 'string') stringEntities[e] = key;
}

var decodeChar = function(orig, code, asciiOnly) {
    return (code < 256 || !asciiOnly) ? String.fromCharCode(code) : orig;
};

exports.encode = function (str, options) {
    if (typeof str !== 'string') {
        throw new TypeError('Expected a String');
    }

    var opts = options || {},
        decimalOnly = opts.decimalOnly || false,
        maxCode = opts.asciiOnly ? 256 : 128;

    return str.split('').map(function (c) {
        var e = !decimalOnly ? revEntities[c] : !opts.asciiOnly ? stringEntities[c] : undefined;
        var cc = c.charCodeAt(0);
        if (e) {
            return '&' + e + ';';
        }
        else if (cc < 32 || cc >= maxCode) {
            return '&#' + cc + ';';
        }
        else if (c.match(/\s/)) {
            return c;
        }
        else {
            return c;
        }
    }).join('');
};

exports.encodeForDb = function (str) {
    return exports.encode(str, { asciiOnly: true, decimalOnly: true });
}

exports.decode = function (str, options) {
    if (typeof str !== 'string') {
        throw new TypeError('Expected a String');
    }

    var opts = options || {},
        asciiOnly = opts.asciiOnly || false;

    return str
        .replace(/&#(\d+);?/g, function (_, code) {
            return decodeChar(_, code, asciiOnly);
        })
        .replace(/&#[xX]([A-Fa-f0-9]+);?/g, function (_, hex) {
            return decodeChar(_, parseInt(hex, 16), asciiOnly);
        })
        .replace(/&([^;\W]+);?/g, function (m, e) {
            var target = entities[e];

            if (typeof target === 'number') {
                return decodeChar(m, target, asciiOnly);
            }
            else if (typeof target === 'string') {
                return target;
            }
            else {
                return m;
            }
        })
    ;
};

exports.decodeForDb = function (str) {
    return exports.decode(str, { asciiOnly: true });
}