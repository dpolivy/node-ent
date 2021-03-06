var punycode = require('punycode');
var entities = require('./entities.json');
var revEntities = require('./reversed.json');

exports.encode = function (str, opts) {
    if (typeof str !== 'string') {
        throw new TypeError('Expected a String');
    }
    var special = {
        '"': true, "'": true,
        '<': true, '>': true,
        '&': true
    };
    if (!opts) opts = {};
    
    var numeric = true;
    if (opts.named) numeric = false;
    if (opts.numeric !== undefined) numeric = opts.numeric;
    
    return str.split('').map(function (c) {
        var cc = c.charCodeAt(0);
        var e = revEntities[cc];
        if (e && (cc >= 127 || special[c]) && !numeric) {
            return '&' + (e.match(/;$/) ? e : e + ';');
        }
        else if (cc < 32 || cc >= 127 || special[c]) {
            return '&#' + cc + ';';
        }
        else if (/\s/.test(c)) {
            return c;
        }
        else {
            return c;
        }
    }).join('');
};

exports.decode = function (str) {
    if (typeof str !== 'string') {
        throw new TypeError('Expected a String');
    }
    
    return str
        .replace(/&#(\d+);?/g, function (_, code) {
            return punycode.ucs2.encode([code]);
        })
        .replace(/&#[xX]([A-Fa-f0-9]+);?/g, function (_, hex) {
            return punycode.ucs2.encode([parseInt(hex, 16)]);
        })
        .replace(/&([^;\W]+;?)/g, function (m, e) {
            var ee = e.replace(/;$/, '');
            var target = entities[e]
                || (e.match(/;$/) && entities[ee])
            ;
            
            if (typeof target === 'number') {
                return punycode.ucs2.encode([target]);
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
