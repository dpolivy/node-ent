var punycode = require('punycode');
var entities = require('./entities.json');
var revEntities = require('./reversed.json');

// Always escape these characters when encoding
var alwaysEscape = {
    '34': 'quot',
    '38': 'amp',
    '39': 'apos',
    '60': 'lt',
    '62': 'gt'
};

var getNamedEntity = function (code, useNamedReferences) {
    var e = alwaysEscape[code];

    // Only use named references for non-ASCII characters
    if (!e && useNamedReferences && /[^\x20-\x7F]/.test(punycode.ucs2.encode([code]))) {
        e = revEntities[code];
    }

    return e;
};

var decodeChar = function (orig, code, asciiOnly) {
    return (code < 256 || !asciiOnly) ? punycode.ucs2.encode([code]) : orig;
};

exports.encode = function (str, options) {
    if (typeof str !== 'string') {
        throw new TypeError('Expected a String');
    }

    var opts = options || {},
        useNamedReferences = (opts.useNamedReferences !== undefined) ? opts.useNamedReferences : true,
        maxCode = opts.asciiOnly ? 256 : 127;

    return str.split('').map(function (c) {
        var cc = c.charCodeAt(0);
        var e = getNamedEntity(cc, useNamedReferences);
        if (e) {
            return '&' + (e.match(/;$/) ? e : e + ';');
        }
        else if ((!opts.asciiOnly && cc < 32) || cc >= maxCode) {
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
    return exports.encode(str, { asciiOnly: true, useNamedReferences: false });
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
        .replace(/&([^;\W]+;?)/g, function (m, e) {
            var ee = e.replace(/;$/, '');
            var target = entities[e]
                || (e.match(/;$/) && entities[ee])
            ;

            if (typeof target === 'number') {
                return decodeChar(m, target, asciiOnly);
            }
            else if (typeof target === 'string') {
                return asciiOnly && target.charCodeAt(0) > 256 ? m : target;
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