// source: src/utils/universal-swap.proto
/**
 * @fileoverview
 * @enhanceable
 * @suppress {missingRequire} reports error on implicit type usages.
 * @suppress {messageConventions} JS Compiler reports an error if a variable or
 *     field starts with 'MSG_' and isn't a translatable message.
 * @public
 */
// GENERATED CODE -- DO NOT EDIT!
/* eslint-disable */
// @ts-nocheck

var jspb = require("google-protobuf");
var goog = jspb;
var global =
  (typeof globalThis !== "undefined" && globalThis) ||
  (typeof window !== "undefined" && window) ||
  (typeof global !== "undefined" && global) ||
  (typeof self !== "undefined" && self) ||
  function () {
    return this;
  }.call(null) ||
  Function("return this")();

goog.exportSymbol("proto.universalswap.IbcBridgeWasmMemo", null, global);
goog.exportSymbol("proto.universalswap.IbcHooksMemo", null, global);
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.universalswap.IbcHooksMemo = function (opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.universalswap.IbcHooksMemo, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.universalswap.IbcHooksMemo.displayName = "proto.universalswap.IbcHooksMemo";
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.universalswap.IbcBridgeWasmMemo = function (opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.universalswap.IbcBridgeWasmMemo, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.universalswap.IbcBridgeWasmMemo.displayName = "proto.universalswap.IbcBridgeWasmMemo";
}

if (jspb.Message.GENERATE_TO_OBJECT) {
  /**
   * Creates an object representation of this proto.
   * Field names that are reserved in JavaScript and will be renamed to pb_name.
   * Optional fields that are not set will be set to undefined.
   * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
   * For the list of reserved names please see:
   *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
   * @param {boolean=} opt_includeInstance Deprecated. whether to include the
   *     JSPB instance for transitional soy proto support:
   *     http://goto/soy-param-migration
   * @return {!Object}
   */
  proto.universalswap.IbcHooksMemo.prototype.toObject = function (opt_includeInstance) {
    return proto.universalswap.IbcHooksMemo.toObject(opt_includeInstance, this);
  };

  /**
   * Static version of the {@see toObject} method.
   * @param {boolean|undefined} includeInstance Deprecated. Whether to include
   *     the JSPB instance for transitional soy proto support:
   *     http://goto/soy-param-migration
   * @param {!proto.universalswap.IbcHooksMemo} msg The msg instance to transform.
   * @return {!Object}
   * @suppress {unusedLocalVariables} f is only used for nested messages
   */
  proto.universalswap.IbcHooksMemo.toObject = function (includeInstance, msg) {
    var f,
      obj = {
        receiver: msg.getReceiver_asB64(),
        destinationReceiver: jspb.Message.getFieldWithDefault(msg, 2, ""),
        destinationChannel: jspb.Message.getFieldWithDefault(msg, 3, ""),
        destinationDenom: jspb.Message.getFieldWithDefault(msg, 4, "")
      };

    if (includeInstance) {
      obj.$jspbMessageInstance = msg;
    }
    return obj;
  };
}

/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.universalswap.IbcHooksMemo}
 */
proto.universalswap.IbcHooksMemo.deserializeBinary = function (bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.universalswap.IbcHooksMemo();
  return proto.universalswap.IbcHooksMemo.deserializeBinaryFromReader(msg, reader);
};

/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.universalswap.IbcHooksMemo} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.universalswap.IbcHooksMemo}
 */
proto.universalswap.IbcHooksMemo.deserializeBinaryFromReader = function (msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
      case 1:
        var value = /** @type {!Uint8Array} */ (reader.readBytes());
        msg.setReceiver(value);
        break;
      case 2:
        var value = /** @type {string} */ (reader.readString());
        msg.setDestinationReceiver(value);
        break;
      case 3:
        var value = /** @type {string} */ (reader.readString());
        msg.setDestinationChannel(value);
        break;
      case 4:
        var value = /** @type {string} */ (reader.readString());
        msg.setDestinationDenom(value);
        break;
      default:
        reader.skipField();
        break;
    }
  }
  return msg;
};

/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.universalswap.IbcHooksMemo.prototype.serializeBinary = function () {
  var writer = new jspb.BinaryWriter();
  proto.universalswap.IbcHooksMemo.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};

/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.universalswap.IbcHooksMemo} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.universalswap.IbcHooksMemo.serializeBinaryToWriter = function (message, writer) {
  var f = undefined;
  f = message.getReceiver_asU8();
  if (f.length > 0) {
    writer.writeBytes(1, f);
  }
  f = message.getDestinationReceiver();
  if (f.length > 0) {
    writer.writeString(2, f);
  }
  f = message.getDestinationChannel();
  if (f.length > 0) {
    writer.writeString(3, f);
  }
  f = message.getDestinationDenom();
  if (f.length > 0) {
    writer.writeString(4, f);
  }
};

/**
 * optional bytes receiver = 1;
 * @return {!(string|Uint8Array)}
 */
proto.universalswap.IbcHooksMemo.prototype.getReceiver = function () {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};

/**
 * optional bytes receiver = 1;
 * This is a type-conversion wrapper around `getReceiver()`
 * @return {string}
 */
proto.universalswap.IbcHooksMemo.prototype.getReceiver_asB64 = function () {
  return /** @type {string} */ (jspb.Message.bytesAsB64(this.getReceiver()));
};

/**
 * optional bytes receiver = 1;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getReceiver()`
 * @return {!Uint8Array}
 */
proto.universalswap.IbcHooksMemo.prototype.getReceiver_asU8 = function () {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(this.getReceiver()));
};

/**
 * @param {!(string|Uint8Array)} value
 * @return {!proto.universalswap.IbcHooksMemo} returns this
 */
proto.universalswap.IbcHooksMemo.prototype.setReceiver = function (value) {
  return jspb.Message.setProto3BytesField(this, 1, value);
};

/**
 * optional string destination_receiver = 2;
 * @return {string}
 */
proto.universalswap.IbcHooksMemo.prototype.getDestinationReceiver = function () {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};

/**
 * @param {string} value
 * @return {!proto.universalswap.IbcHooksMemo} returns this
 */
proto.universalswap.IbcHooksMemo.prototype.setDestinationReceiver = function (value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};

/**
 * optional string destination_channel = 3;
 * @return {string}
 */
proto.universalswap.IbcHooksMemo.prototype.getDestinationChannel = function () {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};

/**
 * @param {string} value
 * @return {!proto.universalswap.IbcHooksMemo} returns this
 */
proto.universalswap.IbcHooksMemo.prototype.setDestinationChannel = function (value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};

/**
 * optional string destination_denom = 4;
 * @return {string}
 */
proto.universalswap.IbcHooksMemo.prototype.getDestinationDenom = function () {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};

/**
 * @param {string} value
 * @return {!proto.universalswap.IbcHooksMemo} returns this
 */
proto.universalswap.IbcHooksMemo.prototype.setDestinationDenom = function (value) {
  return jspb.Message.setProto3StringField(this, 4, value);
};

if (jspb.Message.GENERATE_TO_OBJECT) {
  /**
   * Creates an object representation of this proto.
   * Field names that are reserved in JavaScript and will be renamed to pb_name.
   * Optional fields that are not set will be set to undefined.
   * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
   * For the list of reserved names please see:
   *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
   * @param {boolean=} opt_includeInstance Deprecated. whether to include the
   *     JSPB instance for transitional soy proto support:
   *     http://goto/soy-param-migration
   * @return {!Object}
   */
  proto.universalswap.IbcBridgeWasmMemo.prototype.toObject = function (opt_includeInstance) {
    return proto.universalswap.IbcBridgeWasmMemo.toObject(opt_includeInstance, this);
  };

  /**
   * Static version of the {@see toObject} method.
   * @param {boolean|undefined} includeInstance Deprecated. Whether to include
   *     the JSPB instance for transitional soy proto support:
   *     http://goto/soy-param-migration
   * @param {!proto.universalswap.IbcBridgeWasmMemo} msg The msg instance to transform.
   * @return {!Object}
   * @suppress {unusedLocalVariables} f is only used for nested messages
   */
  proto.universalswap.IbcBridgeWasmMemo.toObject = function (includeInstance, msg) {
    var f,
      obj = {
        destinationReceiver: jspb.Message.getFieldWithDefault(msg, 1, ""),
        destinationChannel: jspb.Message.getFieldWithDefault(msg, 2, ""),
        destinationDenom: jspb.Message.getFieldWithDefault(msg, 3, "")
      };

    if (includeInstance) {
      obj.$jspbMessageInstance = msg;
    }
    return obj;
  };
}

/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.universalswap.IbcBridgeWasmMemo}
 */
proto.universalswap.IbcBridgeWasmMemo.deserializeBinary = function (bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.universalswap.IbcBridgeWasmMemo();
  return proto.universalswap.IbcBridgeWasmMemo.deserializeBinaryFromReader(msg, reader);
};

/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.universalswap.IbcBridgeWasmMemo} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.universalswap.IbcBridgeWasmMemo}
 */
proto.universalswap.IbcBridgeWasmMemo.deserializeBinaryFromReader = function (msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
      case 1:
        var value = /** @type {string} */ (reader.readString());
        msg.setDestinationReceiver(value);
        break;
      case 2:
        var value = /** @type {string} */ (reader.readString());
        msg.setDestinationChannel(value);
        break;
      case 3:
        var value = /** @type {string} */ (reader.readString());
        msg.setDestinationDenom(value);
        break;
      default:
        reader.skipField();
        break;
    }
  }
  return msg;
};

/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.universalswap.IbcBridgeWasmMemo.prototype.serializeBinary = function () {
  var writer = new jspb.BinaryWriter();
  proto.universalswap.IbcBridgeWasmMemo.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};

/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.universalswap.IbcBridgeWasmMemo} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.universalswap.IbcBridgeWasmMemo.serializeBinaryToWriter = function (message, writer) {
  var f = undefined;
  f = message.getDestinationReceiver();
  if (f.length > 0) {
    writer.writeString(1, f);
  }
  f = message.getDestinationChannel();
  if (f.length > 0) {
    writer.writeString(2, f);
  }
  f = message.getDestinationDenom();
  if (f.length > 0) {
    writer.writeString(3, f);
  }
};

/**
 * optional string destination_receiver = 1;
 * @return {string}
 */
proto.universalswap.IbcBridgeWasmMemo.prototype.getDestinationReceiver = function () {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};

/**
 * @param {string} value
 * @return {!proto.universalswap.IbcBridgeWasmMemo} returns this
 */
proto.universalswap.IbcBridgeWasmMemo.prototype.setDestinationReceiver = function (value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};

/**
 * optional string destination_channel = 2;
 * @return {string}
 */
proto.universalswap.IbcBridgeWasmMemo.prototype.getDestinationChannel = function () {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};

/**
 * @param {string} value
 * @return {!proto.universalswap.IbcBridgeWasmMemo} returns this
 */
proto.universalswap.IbcBridgeWasmMemo.prototype.setDestinationChannel = function (value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};

/**
 * optional string destination_denom = 3;
 * @return {string}
 */
proto.universalswap.IbcBridgeWasmMemo.prototype.getDestinationDenom = function () {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};

/**
 * @param {string} value
 * @return {!proto.universalswap.IbcBridgeWasmMemo} returns this
 */
proto.universalswap.IbcBridgeWasmMemo.prototype.setDestinationDenom = function (value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};

goog.object.extend(exports, proto.universalswap);
