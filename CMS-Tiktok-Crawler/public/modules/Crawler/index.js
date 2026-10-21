/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./modules/Core/resources/js/Action/api.ts":
/*!*************************************************!*\
  !*** ./modules/Core/resources/js/Action/api.ts ***!
  \*************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ApiError: () => (/* binding */ ApiError),
/* harmony export */   api: () => (/* binding */ api),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__),
/* harmony export */   http: () => (/* binding */ http)
/* harmony export */ });
/* harmony import */ var axios__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! axios */ "./node_modules/axios/lib/axios.js");
/* harmony import */ var axios__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! axios */ "./node_modules/axios/index.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, e) { if ("object" != _typeof(t) || !t) return t; var r; if ("undefined" != typeof Symbol && void 0 !== (r = t[Symbol.toPrimitive])) { var i = r.call(t, e || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === e ? String : Number)(t); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _callSuper(t, o, e) { return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e)); }
function _possibleConstructorReturn(t, e) { if (e && ("object" == _typeof(e) || "function" == typeof e)) return e; if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined"); return _assertThisInitialized(t); }
function _assertThisInitialized(e) { if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); return e; }
function _inherits(t, e) { if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function"); t.prototype = Object.create(e && e.prototype, { constructor: { value: t, writable: !0, configurable: !0 } }), Object.defineProperty(t, "prototype", { writable: !1 }), e && _setPrototypeOf(t, e); }
function _wrapNativeSuper(t) { var r = "function" == typeof Map ? new Map() : void 0; return _wrapNativeSuper = function _wrapNativeSuper(t) { if (null === t || !_isNativeFunction(t)) return t; if ("function" != typeof t) throw new TypeError("Super expression must either be null or a function"); if (void 0 !== r) { if (r.has(t)) return r.get(t); r.set(t, Wrapper); } function Wrapper() { return _construct(t, arguments, _getPrototypeOf(this).constructor); } return Wrapper.prototype = Object.create(t.prototype, { constructor: { value: Wrapper, enumerable: !1, writable: !0, configurable: !0 } }), _setPrototypeOf(Wrapper, t); }, _wrapNativeSuper(t); }
function _construct(t, e, r) { if (_isNativeReflectConstruct()) return Reflect.construct.apply(null, arguments); var o = [null]; o.push.apply(o, e); var p = new (t.bind.apply(t, o))(); return r && _setPrototypeOf(p, r.prototype), p; }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
function _isNativeFunction(t) { try { return -1 !== Function.toString.call(t).indexOf("[native code]"); } catch (n) { return "function" == typeof t; } }
function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
function _getPrototypeOf(t) { return _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) { return t.__proto__ || Object.getPrototypeOf(t); }, _getPrototypeOf(t); }

var ApiError = /*#__PURE__*/function (_Error) {
  function ApiError(status, message) {
    var _this;
    var errors = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    _classCallCheck(this, ApiError);
    _this = _callSuper(this, ApiError, [message]);
    _this.name = 'ApiError';
    _this.status = status;
    _this.errors = errors;
    return _this;
  }
  _inherits(ApiError, _Error);
  return _createClass(ApiError);
}(/*#__PURE__*/_wrapNativeSuper(Error));
var csrfToken = function csrfToken() {
  var _document$querySelect, _document$querySelect2;
  return (_document$querySelect = (_document$querySelect2 = document.querySelector('meta[name="csrf-token"]')) === null || _document$querySelect2 === void 0 ? void 0 : _document$querySelect2.content) !== null && _document$querySelect !== void 0 ? _document$querySelect : '';
};
var http = axios__WEBPACK_IMPORTED_MODULE_0__["default"].create({
  baseURL: /* unsupported import.meta.env.VITE_API_URL */ undefined.VITE_API_URL || '',
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
});
http.interceptors.request.use(function (config) {
  var token = csrfToken();
  if (token) {
    config.headers.set('X-CSRF-TOKEN', token);
  }
  return config;
});
http.interceptors.response.use(function (response) {
  return response;
}, function (error) {
  if (error instanceof axios__WEBPACK_IMPORTED_MODULE_1__.AxiosError) {
    var _error$response$data, _error$response, _error$response$statu, _error$response2, _payload$message, _payload$errors;
    var payload = (_error$response$data = (_error$response = error.response) === null || _error$response === void 0 ? void 0 : _error$response.data) !== null && _error$response$data !== void 0 ? _error$response$data : {};
    var status = (_error$response$statu = (_error$response2 = error.response) === null || _error$response2 === void 0 ? void 0 : _error$response2.status) !== null && _error$response$statu !== void 0 ? _error$response$statu : 0;
    var message = (_payload$message = payload.message) !== null && _payload$message !== void 0 ? _payload$message : status === 419 ? 'CSRF token mismatch. Please reload the page.' : error.message;
    return Promise.reject(new ApiError(status, message, (_payload$errors = payload.errors) !== null && _payload$errors !== void 0 ? _payload$errors : {}));
  }
  return Promise.reject(error);
});
function api(_x) {
  return _api.apply(this, arguments);
}
function _api() {
  _api = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(url) {
    var config,
      response,
      _args = arguments;
    return _regenerator().w(function (_context) {
      while (1) switch (_context.n) {
        case 0:
          config = _args.length > 1 && _args[1] !== undefined ? _args[1] : {};
          _context.n = 1;
          return http(_objectSpread({
            url: url
          }, config));
        case 1:
          response = _context.v;
          return _context.a(2, response.data);
      }
    }, _callee);
  }));
  return _api.apply(this, arguments);
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (http);

/***/ }),

/***/ "./modules/Core/resources/js/routes/registry.ts":
/*!******************************************************!*\
  !*** ./modules/Core/resources/js/routes/registry.ts ***!
  \******************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getAdminRoutes: () => (/* binding */ getAdminRoutes),
/* harmony export */   getMenuRoutes: () => (/* binding */ getMenuRoutes),
/* harmony export */   getPrivateRoutes: () => (/* binding */ getPrivateRoutes),
/* harmony export */   getPublicRoutes: () => (/* binding */ getPublicRoutes),
/* harmony export */   getRoutes: () => (/* binding */ getRoutes),
/* harmony export */   isAdminRoute: () => (/* binding */ isAdminRoute),
/* harmony export */   registerRoute: () => (/* binding */ registerRoute),
/* harmony export */   registerRoutes: () => (/* binding */ registerRoutes),
/* harmony export */   subscribe: () => (/* binding */ subscribe),
/* harmony export */   useAdminRoutes: () => (/* binding */ useAdminRoutes),
/* harmony export */   useBareRoutes: () => (/* binding */ useBareRoutes),
/* harmony export */   useMenuRoutes: () => (/* binding */ useMenuRoutes),
/* harmony export */   useRoutes: () => (/* binding */ useRoutes)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "./node_modules/react/index.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, e) { if ("object" != _typeof(t) || !t) return t; var r; if ("undefined" != typeof Symbol && void 0 !== (r = t[Symbol.toPrimitive])) { var i = r.call(t, e || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === e ? String : Number)(t); }

var registry = function registry() {
  var _w$__CMS_ROUTES_REGIS;
  var w = window;
  return (_w$__CMS_ROUTES_REGIS = w.__CMS_ROUTES_REGISTRY__) !== null && _w$__CMS_ROUTES_REGIS !== void 0 ? _w$__CMS_ROUTES_REGIS : w.__CMS_ROUTES_REGISTRY__ = {
    routes: [],
    listeners: new Set()
  };
};
var emit = function emit() {
  registry().listeners.forEach(function (listener) {
    return listener();
  });
};
var subscribe = function subscribe(listener) {
  var r = registry();
  r.listeners.add(listener);
  return function () {
    return r.listeners["delete"](listener);
  };
};

/**
 * Check whether a route belongs to AdminLayout.
 */
function isAdminRoute(route) {
  return route.layout !== 'bare' && route.layout !== 'none' && route.isPrivate !== false;
}

/**
 * Register a single route into the Core Route Registry.
 * If a route with the same path already exists, it will be updated/overwritten.
 */
function registerRoute(def) {
  var r = registry();
  var cleanPath = def.path.startsWith('/') ? def.path : "/".concat(def.path);
  var normalized = _objectSpread(_objectSpread({
    layout: 'admin',
    isPrivate: true,
    order: 100
  }, def), {}, {
    path: cleanPath
  });
  r.routes = [].concat(_toConsumableArray(r.routes.filter(function (route) {
    return route.path !== cleanPath;
  })), [normalized]).sort(function (a, b) {
    var _a$order, _b$order;
    return ((_a$order = a.order) !== null && _a$order !== void 0 ? _a$order : 100) - ((_b$order = b.order) !== null && _b$order !== void 0 ? _b$order : 100);
  });
  emit();
}

/**
 * Register multiple routes into the Core Route Registry.
 */
function registerRoutes(defs) {
  defs.forEach(registerRoute);
}

/**
 * Get snapshot list of all registered routes.
 */
function getRoutes() {
  return registry().routes;
}

/**
 * React 18 hook to reactively listen to registered routes (uses useSyncExternalStore).
 */
function useRoutes() {
  return (0,react__WEBPACK_IMPORTED_MODULE_0__.useSyncExternalStore)(subscribe, function () {
    return registry().routes;
  });
}

/**
 * Get only admin (AdminLayout-wrapped) routes.
 */
function getAdminRoutes() {
  return registry().routes.filter(isAdminRoute);
}

/**
 * Get only public or bare routes (not wrapped in AdminLayout).
 */
function getPublicRoutes() {
  return registry().routes.filter(function (r) {
    return !isAdminRoute(r);
  });
}

/**
 * Alias for getAdminRoutes for backward compatibility.
 */
function getPrivateRoutes() {
  return getAdminRoutes();
}

/**
 * Get routes configured for sidebar navigation menu.
 */
function getMenuRoutes() {
  return registry().routes.filter(function (r) {
    return Boolean(r.label) && isAdminRoute(r);
  }).sort(function (a, b) {
    var _a$order2, _b$order2;
    return ((_a$order2 = a.order) !== null && _a$order2 !== void 0 ? _a$order2 : 100) - ((_b$order2 = b.order) !== null && _b$order2 !== void 0 ? _b$order2 : 100);
  });
}

/**
 * React hook to reactively get admin routes.
 */
function useAdminRoutes() {
  var routes = useRoutes();
  return routes.filter(isAdminRoute);
}

/**
 * React hook to reactively get bare/public routes.
 */
function useBareRoutes() {
  var routes = useRoutes();
  return routes.filter(function (r) {
    return !isAdminRoute(r);
  });
}

/**
 * React hook to reactively get sidebar navigation menu routes.
 */
function useMenuRoutes() {
  var routes = useRoutes();
  return routes.filter(function (r) {
    return Boolean(r.label) && isAdminRoute(r);
  }).sort(function (a, b) {
    var _a$order3, _b$order3;
    return ((_a$order3 = a.order) !== null && _a$order3 !== void 0 ? _a$order3 : 100) - ((_b$order3 = b.order) !== null && _b$order3 !== void 0 ? _b$order3 : 100);
  });
}

/***/ }),

/***/ "./modules/Crawler/resources/js/Action/crawlJob.ts":
/*!*********************************************************!*\
  !*** ./modules/Crawler/resources/js/Action/crawlJob.ts ***!
  \*********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   createCrawlJob: () => (/* binding */ createCrawlJob),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__),
/* harmony export */   deleteCrawlJobByID: () => (/* binding */ deleteCrawlJobByID),
/* harmony export */   getCrawlJobByID: () => (/* binding */ getCrawlJobByID),
/* harmony export */   getCrawlJobs: () => (/* binding */ getCrawlJobs),
/* harmony export */   getResults: () => (/* binding */ getResults),
/* harmony export */   getStatisticsSummary: () => (/* binding */ getStatisticsSummary),
/* harmony export */   startCrawlJobByID: () => (/* binding */ startCrawlJobByID),
/* harmony export */   updateCrawlJob: () => (/* binding */ updateCrawlJob)
/* harmony export */ });
/* harmony import */ var _core_Action_api__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @core/Action/api */ "./modules/Core/resources/js/Action/api.ts");

var getCrawlJobs = function getCrawlJobs() {
  var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  return (0,_core_Action_api__WEBPACK_IMPORTED_MODULE_0__.api)('/crawler/crawl-job', {
    params: params
  });
};
var getCrawlJobByID = function getCrawlJobByID(id) {
  return (0,_core_Action_api__WEBPACK_IMPORTED_MODULE_0__.api)("/crawler/crawl-job/".concat(id));
};
var createCrawlJob = function createCrawlJob(data) {
  return (0,_core_Action_api__WEBPACK_IMPORTED_MODULE_0__.api)('/crawler/crawl-job', {
    method: 'POST',
    data: data
  });
};
var updateCrawlJob = function updateCrawlJob(id, data) {
  return (0,_core_Action_api__WEBPACK_IMPORTED_MODULE_0__.api)("/crawler/crawl-job/".concat(id), {
    method: 'PUT',
    data: data
  });
};
var getResults = function getResults(id) {
  var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  return (0,_core_Action_api__WEBPACK_IMPORTED_MODULE_0__.api)("/crawler/crawl-job/".concat(id, "/results"), {
    params: params
  });
};
var getStatisticsSummary = function getStatisticsSummary() {
  return (0,_core_Action_api__WEBPACK_IMPORTED_MODULE_0__.api)('/crawler/crawl-job/statistics-summary');
};
var deleteCrawlJobByID = function deleteCrawlJobByID(id) {
  return (0,_core_Action_api__WEBPACK_IMPORTED_MODULE_0__.api)("/crawler/crawl-job/".concat(id), {
    method: 'DELETE'
  });
};
var startCrawlJobByID = function startCrawlJobByID(id) {
  return (0,_core_Action_api__WEBPACK_IMPORTED_MODULE_0__.api)("/crawler/crawl-job/".concat(id, "/start"), {
    method: 'POST'
  });
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  getCrawlJobs: getCrawlJobs,
  getCrawlJobByID: getCrawlJobByID,
  createCrawlJob: createCrawlJob,
  updateCrawlJob: updateCrawlJob,
  getStatisticsSummary: getStatisticsSummary,
  deleteCrawlJobByID: deleteCrawlJobByID,
  startCrawlJobByID: startCrawlJobByID,
  getResults: getResults
});

/***/ }),

/***/ "./modules/Crawler/resources/js/Action/crawlResult.ts":
/*!************************************************************!*\
  !*** ./modules/Crawler/resources/js/Action/crawlResult.ts ***!
  \************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__),
/* harmony export */   getCrawlResultByAccountID: () => (/* binding */ getCrawlResultByAccountID),
/* harmony export */   getCrawlResultByCrawlJobID: () => (/* binding */ getCrawlResultByCrawlJobID)
/* harmony export */ });
/* harmony import */ var _core_Action_api__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @core/Action/api */ "./modules/Core/resources/js/Action/api.ts");

var getCrawlResultByCrawlJobID = function getCrawlResultByCrawlJobID(id) {
  var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  return (0,_core_Action_api__WEBPACK_IMPORTED_MODULE_0__.api)("/crawlers/crawl-jobs/".concat(id, "/results"), {
    params: params
  });
};
var getCrawlResultByAccountID = function getCrawlResultByAccountID(id) {
  var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  return (0,_core_Action_api__WEBPACK_IMPORTED_MODULE_0__.api)("/crawlers/tiktok-accounts/".concat(id, "/crawl-results"), {
    params: params
  });
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  getCrawlResultByCrawlJobID: getCrawlResultByCrawlJobID,
  getCrawlResultByAccountID: getCrawlResultByAccountID
});

/***/ }),

/***/ "./modules/Crawler/resources/js/index.ts":
/*!***********************************************!*\
  !*** ./modules/Crawler/resources/js/index.ts ***!
  \***********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   createCrawlJob: () => (/* reexport safe */ _Action_crawlJob__WEBPACK_IMPORTED_MODULE_2__.createCrawlJob),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__),
/* harmony export */   deleteCrawlJobByID: () => (/* reexport safe */ _Action_crawlJob__WEBPACK_IMPORTED_MODULE_2__.deleteCrawlJobByID),
/* harmony export */   getCrawlJobByID: () => (/* reexport safe */ _Action_crawlJob__WEBPACK_IMPORTED_MODULE_2__.getCrawlJobByID),
/* harmony export */   getCrawlJobs: () => (/* reexport safe */ _Action_crawlJob__WEBPACK_IMPORTED_MODULE_2__.getCrawlJobs),
/* harmony export */   getCrawlResultByAccountID: () => (/* reexport safe */ _Action_crawlResult__WEBPACK_IMPORTED_MODULE_3__.getCrawlResultByAccountID),
/* harmony export */   getCrawlResultByCrawlJobID: () => (/* reexport safe */ _Action_crawlResult__WEBPACK_IMPORTED_MODULE_3__.getCrawlResultByCrawlJobID),
/* harmony export */   getResults: () => (/* reexport safe */ _Action_crawlJob__WEBPACK_IMPORTED_MODULE_2__.getResults),
/* harmony export */   getStatisticsSummary: () => (/* reexport safe */ _Action_crawlJob__WEBPACK_IMPORTED_MODULE_2__.getStatisticsSummary),
/* harmony export */   startCrawlJobByID: () => (/* reexport safe */ _Action_crawlJob__WEBPACK_IMPORTED_MODULE_2__.startCrawlJobByID),
/* harmony export */   updateCrawlJob: () => (/* reexport safe */ _Action_crawlJob__WEBPACK_IMPORTED_MODULE_2__.updateCrawlJob)
/* harmony export */ });
/* harmony import */ var _core_routes_registry__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @core/routes/registry */ "./modules/Core/resources/js/routes/registry.ts");
/* harmony import */ var _routes_route__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./routes/route */ "./modules/Crawler/resources/js/routes/route.ts");
/* harmony import */ var _Action_crawlJob__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./Action/crawlJob */ "./modules/Crawler/resources/js/Action/crawlJob.ts");
/* harmony import */ var _Action_crawlResult__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./Action/crawlResult */ "./modules/Crawler/resources/js/Action/crawlResult.ts");
/**
 * Entry point for Crawler module.
 * Registers module routes into Core Route Registry upon script load in DOM.
 */



// Tự động đăng ký routes vào Core khi file script được load trên DOM
(0,_core_routes_registry__WEBPACK_IMPORTED_MODULE_0__.registerRoutes)(_routes_route__WEBPACK_IMPORTED_MODULE_1__["default"]);
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_routes_route__WEBPACK_IMPORTED_MODULE_1__["default"]);




/***/ }),

/***/ "./modules/Crawler/resources/js/routes/route.ts":
/*!******************************************************!*\
  !*** ./modules/Crawler/resources/js/routes/route.ts ***!
  \******************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "./node_modules/react/index.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _ant_design_icons__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @ant-design/icons */ "./node_modules/@ant-design/icons/es/icons/RobotOutlined.js");


var CrawlJobsPage = /*#__PURE__*/(0,react__WEBPACK_IMPORTED_MODULE_0__.lazy)(function () {
  return __webpack_require__.e(/*! import() */ "modules/Core/vendor").then(__webpack_require__.bind(__webpack_require__, /*! ../pages/CrawlJobsPage */ "./modules/Crawler/resources/js/pages/CrawlJobsPage.tsx"));
});
var CreateCrawlJobPage = /*#__PURE__*/(0,react__WEBPACK_IMPORTED_MODULE_0__.lazy)(function () {
  return __webpack_require__.e(/*! import() */ "modules/Core/vendor").then(__webpack_require__.bind(__webpack_require__, /*! ../pages/CreateCrawlJobPage */ "./modules/Crawler/resources/js/pages/CreateCrawlJobPage.tsx"));
});
var CrawlJobDetailPage = /*#__PURE__*/(0,react__WEBPACK_IMPORTED_MODULE_0__.lazy)(function () {
  return __webpack_require__.e(/*! import() */ "modules/Core/vendor").then(__webpack_require__.bind(__webpack_require__, /*! ../pages/CrawlJobDetailPage */ "./modules/Crawler/resources/js/pages/CrawlJobDetailPage.tsx"));
});
var EditCrawlJobPage = /*#__PURE__*/(0,react__WEBPACK_IMPORTED_MODULE_0__.lazy)(function () {
  return __webpack_require__.e(/*! import() */ "modules/Core/vendor").then(__webpack_require__.bind(__webpack_require__, /*! ../pages/EditCrawlJobPage */ "./modules/Crawler/resources/js/pages/EditCrawlJobPage.tsx"));
});
var crawlerRoutes = [{
  path: '/crawler/crawl-job',
  component: CrawlJobsPage,
  layout: 'admin',
  title: 'Crawl Jobs',
  label: 'Crawl Jobs',
  icon: _ant_design_icons__WEBPACK_IMPORTED_MODULE_1__["default"],
  order: 10
}, {
  path: '/crawler/crawl-job/create',
  component: CreateCrawlJobPage,
  layout: 'admin',
  title: 'Create Crawl Job'
}, {
  path: '/crawler/crawl-job/:id/edit',
  component: EditCrawlJobPage,
  layout: 'admin',
  title: 'Edit Crawl Job'
}, {
  path: '/crawler/crawl-job/:id',
  component: CrawlJobDetailPage,
  layout: 'admin',
  title: 'Crawl Job Details'
}];
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (crawlerRoutes);

/***/ }),

/***/ "./node_modules/clsx/dist/clsx.mjs":
/*!*****************************************!*\
  !*** ./node_modules/clsx/dist/clsx.mjs ***!
  \*****************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   clsx: () => (/* binding */ clsx),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
function r(e){var t,f,n="";if("string"==typeof e||"number"==typeof e)n+=e;else if("object"==typeof e)if(Array.isArray(e)){var o=e.length;for(t=0;t<o;t++)e[t]&&(f=r(e[t]))&&(n&&(n+=" "),n+=f)}else for(f in e)e[f]&&(n&&(n+=" "),n+=f);return n}function clsx(){for(var e,t,f=0,n="",o=arguments.length;f<o;f++)(e=arguments[f])&&(t=r(e))&&(n&&(n+=" "),n+=t);return n}/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (clsx);

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			id: moduleId,
/******/ 			loaded: false,
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/chunk loaded */
/******/ 	(() => {
/******/ 		var deferred = [];
/******/ 		__webpack_require__.O = (result, chunkIds, fn, priority) => {
/******/ 			if(chunkIds) {
/******/ 				priority = priority || 0;
/******/ 				for(var i = deferred.length; i > 0 && deferred[i - 1][2] > priority; i--) deferred[i] = deferred[i - 1];
/******/ 				deferred[i] = [chunkIds, fn, priority];
/******/ 				return;
/******/ 			}
/******/ 			var notFulfilled = Infinity;
/******/ 			for (var i = 0; i < deferred.length; i++) {
/******/ 				var [chunkIds, fn, priority] = deferred[i];
/******/ 				var fulfilled = true;
/******/ 				for (var j = 0; j < chunkIds.length; j++) {
/******/ 					if ((priority & 1 === 0 || notFulfilled >= priority) && Object.keys(__webpack_require__.O).every((key) => (__webpack_require__.O[key](chunkIds[j])))) {
/******/ 						chunkIds.splice(j--, 1);
/******/ 					} else {
/******/ 						fulfilled = false;
/******/ 						if(priority < notFulfilled) notFulfilled = priority;
/******/ 					}
/******/ 				}
/******/ 				if(fulfilled) {
/******/ 					deferred.splice(i--, 1)
/******/ 					var r = fn();
/******/ 					if (r !== undefined) result = r;
/******/ 				}
/******/ 			}
/******/ 			return result;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/create fake namespace object */
/******/ 	(() => {
/******/ 		var getProto = Object.getPrototypeOf ? (obj) => (Object.getPrototypeOf(obj)) : (obj) => (obj.__proto__);
/******/ 		var leafPrototypes;
/******/ 		// create a fake namespace object
/******/ 		// mode & 1: value is a module id, require it
/******/ 		// mode & 2: merge all properties of value into the ns
/******/ 		// mode & 4: return value when already ns object
/******/ 		// mode & 16: return value when it's Promise-like
/******/ 		// mode & 8|1: behave like require
/******/ 		__webpack_require__.t = function(value, mode) {
/******/ 			if(mode & 1) value = this(value);
/******/ 			if(mode & 8) return value;
/******/ 			if(typeof value === 'object' && value) {
/******/ 				if((mode & 4) && value.__esModule) return value;
/******/ 				if((mode & 16) && typeof value.then === 'function') return value;
/******/ 			}
/******/ 			var ns = Object.create(null);
/******/ 			__webpack_require__.r(ns);
/******/ 			var def = {};
/******/ 			leafPrototypes = leafPrototypes || [null, getProto({}), getProto([]), getProto(getProto)];
/******/ 			for(var current = mode & 2 && value; typeof current == 'object' && !~leafPrototypes.indexOf(current); current = getProto(current)) {
/******/ 				Object.getOwnPropertyNames(current).forEach((key) => (def[key] = () => (value[key])));
/******/ 			}
/******/ 			def['default'] = () => (value);
/******/ 			__webpack_require__.d(ns, def);
/******/ 			return ns;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/ensure chunk */
/******/ 	(() => {
/******/ 		// The chunk loading function for additional chunks
/******/ 		// Since all referenced chunks are already included
/******/ 		// in this file, this function is empty here.
/******/ 		__webpack_require__.e = () => (Promise.resolve());
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/harmony module decorator */
/******/ 	(() => {
/******/ 		__webpack_require__.hmd = (module) => {
/******/ 			module = Object.create(module);
/******/ 			if (!module.children) module.children = [];
/******/ 			Object.defineProperty(module, 'exports', {
/******/ 				enumerable: true,
/******/ 				set: () => {
/******/ 					throw new Error('ES Modules may not assign module.exports or exports.*, Use ESM export syntax, instead: ' + module.id);
/******/ 				}
/******/ 			});
/******/ 			return module;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/node module decorator */
/******/ 	(() => {
/******/ 		__webpack_require__.nmd = (module) => {
/******/ 			module.paths = [];
/******/ 			if (!module.children) module.children = [];
/******/ 			return module;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/jsonp chunk loading */
/******/ 	(() => {
/******/ 		// no baseURI
/******/ 		
/******/ 		// object to store loaded and loading chunks
/******/ 		// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 		// [resolve, reject, Promise] = chunk loading, 0 = chunk loaded
/******/ 		var installedChunks = {
/******/ 			"/modules/Crawler/index": 0
/******/ 		};
/******/ 		
/******/ 		// no chunk on demand loading
/******/ 		
/******/ 		// no prefetching
/******/ 		
/******/ 		// no preloaded
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 		
/******/ 		__webpack_require__.O.j = (chunkId) => (installedChunks[chunkId] === 0);
/******/ 		
/******/ 		// install a JSONP callback for chunk loading
/******/ 		var webpackJsonpCallback = (parentChunkLoadingFunction, data) => {
/******/ 			var [chunkIds, moreModules, runtime] = data;
/******/ 			// add "moreModules" to the modules object,
/******/ 			// then flag all "chunkIds" as loaded and fire callback
/******/ 			var moduleId, chunkId, i = 0;
/******/ 			if(chunkIds.some((id) => (installedChunks[id] !== 0))) {
/******/ 				for(moduleId in moreModules) {
/******/ 					if(__webpack_require__.o(moreModules, moduleId)) {
/******/ 						__webpack_require__.m[moduleId] = moreModules[moduleId];
/******/ 					}
/******/ 				}
/******/ 				if(runtime) var result = runtime(__webpack_require__);
/******/ 			}
/******/ 			if(parentChunkLoadingFunction) parentChunkLoadingFunction(data);
/******/ 			for(;i < chunkIds.length; i++) {
/******/ 				chunkId = chunkIds[i];
/******/ 				if(__webpack_require__.o(installedChunks, chunkId) && installedChunks[chunkId]) {
/******/ 					installedChunks[chunkId][0]();
/******/ 				}
/******/ 				installedChunks[chunkId] = 0;
/******/ 			}
/******/ 			return __webpack_require__.O(result);
/******/ 		}
/******/ 		
/******/ 		var chunkLoadingGlobal = self["webpackChunk"] = self["webpackChunk"] || [];
/******/ 		chunkLoadingGlobal.forEach(webpackJsonpCallback.bind(null, 0));
/******/ 		chunkLoadingGlobal.push = webpackJsonpCallback.bind(null, chunkLoadingGlobal.push.bind(chunkLoadingGlobal));
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module depends on other loaded chunks and execution need to be delayed
/******/ 	var __webpack_exports__ = __webpack_require__.O(undefined, ["modules/Core/vendor"], () => (__webpack_require__("./modules/Crawler/resources/js/index.ts")))
/******/ 	__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ 	
/******/ })()
;