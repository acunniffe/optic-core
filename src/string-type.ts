const isBuiltIn = (function() {
  const built_ins = [
    Object,
    Function,
    Array,
    String,
    Boolean,
    Number,
    Date,
    RegExp,
    Error,
  ];
  const built_ins_length = built_ins.length;

  return function(_constructor) {
    for (let i = 0; i < built_ins_length; i++) {
      if (built_ins[i] === _constructor) {
        return true;
      }
    }
    return false;
  };
})();

const stringType = (function() {
  const _toString = ({}).toString;

  return function(obj) {
    // [object Blah] -> Blah
    const stype = _toString.call(obj).slice(8, -1);

    if ((obj === null) || (obj === undefined)) {
      return stype.toLowerCase();
    }

    const ctype = of(obj);

    if (ctype && !isBuiltIn(ctype)) {
      return ctype.name;
    } else {
      return stype;
    }
  };
})();

function of(obj) {
  if ((obj === null) || (obj === undefined)) {
    return obj;
  } else {
    return obj.constructor;
  }
}

export {
  stringType
};
