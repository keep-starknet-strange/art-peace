import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image/image.dart' as img;
import 'dart:typed_data';
import 'package:http/http.dart' as http;

class HomePage extends StatefulWidget {
  const HomePage({super.key, required this.title});

  final String title;

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  @override
  void initState() {
    super.initState();
    _getBaseCanvas();
    for (int i = 0; i < canvasIds.length; i++) {
      _getCanvas(canvasIds[i]);
    }
  }

  double _scale = 1.0;
  double _previousScale = 1.0;
  late Offset _offset = Offset(
    -(_baseCanvasWidth / 8),
    (2 * _yGap + _outerCanvasHeight).toDouble(),
  );
  late Offset _previousOffset = Offset.zero;
  Offset _currentFocalPoint = Offset.zero;

  final int _baseCanvasWidth = 528;
  final int _baseCanvasHeight = 396;
  late Uint8List baseCanvas = img.encodePng(img.Image(height: _baseCanvasHeight, width: _baseCanvasWidth));
  List<String> baseCanvasColors = [
    "fafafa", "080808", "ba2112", "ff403d", "ff7714", "ffd115", "f5ff05", "199f27", "00ef3f", "152665", "1542ff", "5cfffe", "a13dff", "ff7ad7", "c1d9e6", "895129"
  ];

  int _outerCanvasWidth = 256;
  int _outerCanvasHeight = 192;
  int _xGap = 16;
  int _yGap = 12;
  int canvasOffset = 14;
  List<int> canvasIds = [14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25];
  List<List<String>> canvasColors = [
    [ "fafafa", "080808", "ba2112", "ff403d", "ff7714", "ffd115", "f5ff05",   "199f27", "00ef3f", "152665", "1542ff", "5cfffe", "a13dff", "ff7ad7", "c1d9e6", "0f0966", "f3776  c", "999999", "7377fa", "a534ed", "895129" ],
    [ "fafafa", "080808", "ba2112", "ff403d", "ff7714", "ffd115", "f5ff05",   "199f27", "00ef3f", "152665", "1542ff", "5cfffe", "a13dff", "ff7ad7", "c1d9e6", "ff9132", "ed7d2  b", "e8472d", "131521", "4c5b7e", "895129" ],
    [ "fafafa", "080808", "ba2112", "ff403d", "ff7714", "ffd115", "f5ff05",   "199f27", "00ef3f", "152665", "1542ff", "5cfffe", "a13dff", "ff7ad7", "c1d9e6", "ff93ba", "34ff3  5", "dbb690", "f6c297", "895129" ],
    [ "f79626", "fafafa", "080808", "ba2112", "ff403d", "ff7714", "ffd115",   "f5ff05", "199f27", "00ef3f", "152665", "1542ff", "5cfffe", "a13dff", "ff7ad7", "c1d9e6", "f2e28  2", "ab8100", "bdaa70", "d3c5aa", "bd9b30", "895129" ],
    [ "0a0a0a", "fafafa", "ba2112", "ff403d", "ff7714", "ffd115", "f5ff05",   "199f27", "00ef3f", "152665", "1542ff", "5cfffe", "a13dff", "ff7ad7", "c1d9e6", "895129" ],
    [ "fafafa", "080808", "ba2112", "ff403d", "ff7714", "ffd115", "f5ff05",   "199f27", "00ef3f", "152665", "1542ff", "5cfffe", "a13dff", "ff7ad7", "c1d9e6", "9fe7c7", "e3806  f", "4451ad", "000d64", "67f81e", "895129" ],
    [ "6882ec", "fafafa", "080808", "ba2112", "ff403d", "ff7714", "ffd115",   "f5ff05", "199f27", "00ef3f", "152665", "1542ff", "5cfffe", "a13dff", "ff7ad7", "c1d9e6", "869be  e", "c2cdf8", "bba53d", "895129" ],
    [ "fafafa", "080808", "ba2112", "ff403d", "ff7714", "ffd115", "f5ff05",   "199f27", "00ef3f", "152665", "1542ff", "5cfffe", "a13dff", "ff7ad7", "c1d9e6", "f79626", "f2e28  2", "ab8100", "bdaa70", "d3c5aa", "bd9b30", "895129" ],
    [ "fafafa", "080808", "ba2112", "ff403d", "ff7714", "ffd115", "f5ff05",   "199f27", "00ef3f", "152665", "1542ff", "5cfffe", "a13dff", "ff7ad7", "c1d9e6", "141456", "ed7d6  f", "ec5731", "895129" ],
    [ "fafafa", "080808", "ba2112", "ff403d", "ff7714", "ffd115", "f5ff05",   "199f27", "00ef3f", "152665", "1542ff", "5cfffe", "a13dff", "ff7ad7", "c1d9e6", "141456", "ed7d6  f", "63d86d", "e78600", "afe9f5", "28fff8", "939598", "895129" ],
    [ "fafafa", "080808", "ba2112", "ff403d", "ff7714", "ffd115", "f5ff05",   "199f27", "00ef3f", "152665", "1542ff", "5cfffe", "a13dff", "ff7ad7", "c1d9e6", "141456", "ed7d6  f", "fe96b8", "f03846", "fbe1bc", "03ff3d", "895129" ],
    [ "fafafa", "080808", "ba2112", "ff403d", "ff7714", "ffd115", "f5ff05",   "199f27", "00ef3f", "152665", "1542ff", "5cfffe", "a13dff", "ff7ad7", "c1d9e6", "141456", "ed7d6  f", "f79626", "6882ec", "895129" ]
  ];
  late List<List<int>> canvasPositions = [
    [-_outerCanvasWidth - _xGap, -_outerCanvasHeight - _yGap],
    [0, -_outerCanvasHeight - _yGap],
    [_outerCanvasWidth + _xGap, -_outerCanvasHeight - _yGap],
    [2 * _outerCanvasWidth + 2 * _xGap, -_outerCanvasHeight - _yGap],
    [-_outerCanvasWidth - _xGap, 0],
    [2 * _outerCanvasWidth + 2 * _xGap, 0],
    [-_outerCanvasWidth - _xGap, _outerCanvasHeight + _yGap],
    [2 * _outerCanvasWidth + 2 * _xGap, _outerCanvasHeight + _yGap],
    [-_outerCanvasWidth - _xGap, 2 * _outerCanvasHeight + 2 * _yGap],
    [0, 2 * _outerCanvasHeight + 2 * _yGap],
    [_outerCanvasWidth + _xGap, 2 * _outerCanvasHeight + 2 * _yGap],
    [2 * _outerCanvasWidth + 2 * _xGap, 2 * _outerCanvasHeight + 2 * _yGap],
  ];
    
  late List<Uint8List> canvasImgs = [
    img.encodePng(img.Image(height: _outerCanvasHeight, width: _outerCanvasWidth)),
    img.encodePng(img.Image(height: _outerCanvasHeight, width: _outerCanvasWidth)),
    img.encodePng(img.Image(height: _outerCanvasHeight, width: _outerCanvasWidth)),
    img.encodePng(img.Image(height: _outerCanvasHeight, width: _outerCanvasWidth)),
    img.encodePng(img.Image(height: _outerCanvasHeight, width: _outerCanvasWidth)),
    img.encodePng(img.Image(height: _outerCanvasHeight, width: _outerCanvasWidth)),
    img.encodePng(img.Image(height: _outerCanvasHeight, width: _outerCanvasWidth)),
    img.encodePng(img.Image(height: _outerCanvasHeight, width: _outerCanvasWidth)),
    img.encodePng(img.Image(height: _outerCanvasHeight, width: _outerCanvasWidth)),
    img.encodePng(img.Image(height: _outerCanvasHeight, width: _outerCanvasWidth)),
    img.encodePng(img.Image(height: _outerCanvasHeight, width: _outerCanvasWidth)),
    img.encodePng(img.Image(height: _outerCanvasHeight, width: _outerCanvasWidth)),
  ];

  _getCanvas(int canvasId) async {
    String url = 'https://api.art-peace.net/get-world-canvas?worldId=$canvasId';
    final response = await http.get(Uri.parse(url));
    // Interpret the response body as a Uint8List using the above typescript code
    Uint8List imageBytes = response.bodyBytes;
    // Convert the Uint8List to an image
    int width = 256;
    int height = 192;
    int bitwidth = 5;
    int canvasBits = width * height * bitwidth;
    int oneByteBitOffset = 8 - bitwidth;
    int twoByteBitOffset = 16 - bitwidth;
    List<int> dataArray = [];
    for (int bitPos = 0; bitPos < canvasBits; bitPos += bitwidth) {
      int bytePos = (bitPos / 8).floor();
      int bitOffset = bitPos % 8;
      if (bitOffset <= oneByteBitOffset) {
        int byte = imageBytes[bytePos];
        int value = (byte >> (oneByteBitOffset - bitOffset)) & 31;
        dataArray.add(value);
      } else {
        int byte = (imageBytes[bytePos] << 8) | imageBytes[bytePos + 1];
        int value = (byte >> (twoByteBitOffset - bitOffset)) & 31;
        dataArray.add(value);
      }
    }
    List<int> imageDataArray = [];
    for (int i = 0; i < dataArray.length; i++) {
      String color = "#" + canvasColors[canvasId - canvasOffset][dataArray[i]] + "FF";
      if (color.isEmpty) {
        color = "#000000FF";
      }
      RegExp exp = RegExp(r'\w\w');
      Iterable<RegExpMatch> matches = exp.allMatches(color);
      if (matches.isEmpty) {
        return;
      }
      List<String> splitColor = matches.map((match) => match.group(0)!).toList();
      int r = int.parse(splitColor[0], radix: 16);
      int g = int.parse(splitColor[1], radix: 16);
      int b = int.parse(splitColor[2], radix: 16);
      imageDataArray.add(r);
      imageDataArray.add(g);
      imageDataArray.add(b);
    }
    ByteBuffer byteBuffer = Uint8List.fromList(imageDataArray).buffer;
    img.Image image = img.Image.fromBytes(bytes: byteBuffer, width: width, height: height);
    setState(() {
      canvasImgs[canvasId - canvasOffset] = img.encodePng(image);
    });
  }

  _getBaseCanvas() async {
    String url = 'https://api.art-peace.net/get-world-canvas?worldId=13';
    final response = await http.get(Uri.parse(url));
    // Interpret the response body as a Uint8List using the above typescript code
    Uint8List imageBytes = response.bodyBytes;
    // Convert the Uint8List to an image
    int width = 528;
    int height = 396;
    int bitwidth = 5;
    int canvasBits = width * height * bitwidth;
    int oneByteBitOffset = 8 - bitwidth;
    int twoByteBitOffset = 16 - bitwidth;
    List<int> dataArray = [];
    for (int bitPos = 0; bitPos < canvasBits; bitPos += bitwidth) {
      int bytePos = (bitPos / 8).floor();
      int bitOffset = bitPos % 8;
      if (bitOffset <= oneByteBitOffset) {
        int byte = imageBytes[bytePos];
        int value = (byte >> (oneByteBitOffset - bitOffset)) & 31;
        dataArray.add(value);
      } else {
        int byte = (imageBytes[bytePos] << 8) | imageBytes[bytePos + 1];
        int value = (byte >> (twoByteBitOffset - bitOffset)) & 31;
        dataArray.add(value);
      }
    }
    List<int> imageDataArray = [];
    for (int i = 0; i < dataArray.length; i++) {
      String color = "#" + baseCanvasColors[dataArray[i]] + "FF";
      if (color.isEmpty) {
        color = "#000000FF";
      }
      RegExp exp = RegExp(r'\w\w');
      Iterable<RegExpMatch> matches = exp.allMatches(color);
      if (matches.isEmpty) {
        return;
      }
      List<String> splitColor = matches.map((match) => match.group(0)!).toList();
      int r = int.parse(splitColor[0], radix: 16);
      int g = int.parse(splitColor[1], radix: 16);
      int b = int.parse(splitColor[2], radix: 16);
      imageDataArray.add(r);
      imageDataArray.add(g);
      imageDataArray.add(b);
    }
    ByteBuffer byteBuffer = Uint8List.fromList(imageDataArray).buffer;
    img.Image image = img.Image.fromBytes(bytes: byteBuffer, width: width, height: height);
    setState(() {
      baseCanvas = img.encodePng(image);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Padding(
        padding: EdgeInsets.only(top: 0, left: 0, right: 0, bottom: 0),
        child: Stack(
          alignment: Alignment.center,
          children: <Widget>[
            FractionallySizedBox(
              widthFactor: 1.0,
              heightFactor: 1.0,
              child: GestureDetector(
                onScaleStart: (details) {
                  setState(() {
                    if (details.pointerCount == 2){
                      _previousScale = _scale;
                      _currentFocalPoint = details.focalPoint;
                    } else if(details.pointerCount == 1){
                      _previousOffset = details.focalPoint;
                    }
                  });
                },
                onScaleUpdate: (details) {
                  setState(() {
                    if (details.pointerCount == 2) {
                      _scale = _previousScale * details.scale;
                      _scale = _scale.clamp(1, 10);
                    }

                    if (details.pointerCount == 1) {
                      final Offset delta = details.focalPoint - _previousOffset;
                      _previousOffset = details.focalPoint;
                      _offset += delta;
                  }
                  });
                },
                onScaleEnd: (details) {
                  setState(() {
                    _previousScale = 1.0;
                  });
                },
                behavior: HitTestBehavior.translucent,
                child: Transform(
                  alignment: Alignment.center,
                  transform: Matrix4.identity()
                    ..translate(_offset.dx, _offset.dy)
                    ..scale(_scale),
                  child: Stack(
                    clipBehavior: Clip.none,
                    alignment: Alignment.center,
                    children: <Widget>[
                      Positioned(
                        left: 0,
                        top: 0,
                        child: Image.memory(
                          baseCanvas,
                          width: _baseCanvasWidth.toDouble(),
                          height: _baseCanvasHeight.toDouble(),
                          filterQuality: FilterQuality.none,
                          gaplessPlayback: true,
                        ),
                      ),
                      for (int i = 0; i < canvasImgs.length; i++)
                        Positioned(
                          left: canvasPositions[i][0].toDouble(),
                          top: canvasPositions[i][1].toDouble(),
                          child: Image.memory(
                            canvasImgs[i],
                            width: _outerCanvasWidth.toDouble(),
                            height: _outerCanvasHeight.toDouble(),
                            filterQuality: FilterQuality.none,
                            gaplessPlayback: true,
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
