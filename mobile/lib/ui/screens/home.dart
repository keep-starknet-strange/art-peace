import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image/image.dart' as img;

import '../../services/canvas.dart';
import '../footer.dart';

class PixelData {
  final int x;
  final int y;
  final int color;

  PixelData(this.x, this.y, this.color);
}

class HomePage extends StatefulWidget {
  const HomePage({super.key, required this.title, this.canvasImgs});

  final String title;
  final List<Uint8List>? canvasImgs;

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  @override
  void initState() {
    super.initState();
    if (widget.canvasImgs != null) {
      canvasImgs = widget.canvasImgs!;
    } else {
      canvasImgs = [];
    }
  }
  List<Uint8List> canvasImgs = [];

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

  int _outerCanvasWidth = 256;
  int _outerCanvasHeight = 192;
  int _xGap = 16;
  int _yGap = 12;
  late List<List<int>> canvasPositions = [
    [0, 0],
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

  _submitPixels() async {
    if (_pendingPixels.isEmpty) {
      return;
    }
    List<PixelData> pixelsToSubmit = _pendingPixels.toList();
    _pendingPixels.clear();
    img.Image image = img.decodeImage(canvasImgs[_selectedCanvas])!;
    for (int i = 0; i < pixelsToSubmit.length; i++) {
      int x = pixelsToSubmit[i].x;
      int y = pixelsToSubmit[i].y;
      int color = pixelsToSubmit[i].color;
      // TODO: Submit onchain
      // Add pixel to the canvas image
      if (x >= 0 && x < getCanvasWidth(_selectedCanvas + canvasOffset) && y >= 0 && y < getCanvasHeight(_selectedCanvas + canvasOffset)) {
        int colorValue = int.parse('0xff${canvasColors[_selectedCanvas][color]}');
        img.Color pixelColor = img.ColorUint8.rgb(
          (colorValue >> 16) & 0xFF,
          (colorValue >> 8) & 0xFF,
          colorValue & 0xFF,
        );
        image.setPixel(x, y, pixelColor);
      }
    }
    setState(() {
      canvasImgs[_selectedCanvas] = Uint8List.fromList(img.encodePng(image));
    });
  }

  int _selectedCanvas = 0;
  int _selectedX = -1;
  int _selectedY = -1;
  List<PixelData> _pendingPixels = [];
  final int maxPendingPixels = 5;
  _getInverseColor(int color) {
    int r = 255 - ((color >> 16) & 0xFF);
    int g = 255 - ((color >> 8) & 0xFF);
    int b = 255 - (color & 0xFF);
    return Color.fromARGB(255, r, g, b);
  }
  _selectCanvas(int index, int xPos, int yPos) {
    if (index != _selectedCanvas) {
      setState(() {
        if (_selectedColor != -1 && _selectedColor > canvasColors[index].length) {
          _selectedColor = -1;
        }
        _selectedCanvas = index;
        _selectedX = -1;
        _selectedY = -1;
        _pendingPixels.clear();
      });
      return;
    } else {
      if (_selectedColor == -1) {
        return;
      }
      setState(() {
        _selectedX = xPos;
        _selectedY = yPos;
        if (_pendingPixels.length < maxPendingPixels) {
          _pendingPixels.add(PixelData(xPos, yPos, _selectedColor));
          if (_pendingPixels.length == maxPendingPixels) {
            _submitPixels();
          }
        }
      });
      return;
    }
  }

  bool _paletteOpen = false;
  int _selectedColor = -1;
  _togglePalette() {
    setState(() {
      _paletteOpen = !_paletteOpen;
    });
  }
  _selectColor(int color) {
    setState(() {
      _selectedColor = color;
      _paletteOpen = false;
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
                        child: GestureDetector(
                          onTapUp: (details) {
                            _selectCanvas(0, details.localPosition.dx.toInt(), details.localPosition.dy.toInt());
                          },
                          behavior: HitTestBehavior.translucent,
                          child: Image.memory(
                            canvasImgs[0],
                            width: canvasSizes[0][0].toDouble(),
                            height: canvasSizes[0][1].toDouble(),
                            filterQuality: FilterQuality.none,
                            gaplessPlayback: true,
                          ),
                        ),
                      ),
                      for (int i = 1; i < canvasImgs.length; i++)
                        Positioned(
                          left: canvasPositions[i][0].toDouble(),
                          top: canvasPositions[i][1].toDouble(),
                          child: GestureDetector(
                            onTapUp: (details) {
                              _selectCanvas(i, details.localPosition.dx.toInt(), details.localPosition.dy.toInt());
                            },
                            behavior: HitTestBehavior.translucent,
                            child: Image.memory(
                              canvasImgs[i],
                              width: _outerCanvasWidth.toDouble(),
                              height: _outerCanvasHeight.toDouble(),
                              filterQuality: FilterQuality.none,
                              gaplessPlayback: true,
                            ),
                          ),
                        ),
                      for (int i = 0; i < _pendingPixels.length; i++)
                        Positioned(
                          left: canvasPositions[_selectedCanvas][0].toDouble() + _pendingPixels[i].x.toDouble(),
                          top: canvasPositions[_selectedCanvas][1].toDouble() + _pendingPixels[i].y.toDouble(),
                          child: Container(
                            width: 1,
                            height: 1,
                            decoration: BoxDecoration(
                              color: Color(int.parse('0xff${canvasColors[_selectedCanvas][_pendingPixels[i].color]}')),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            ),
            Positioned(
              right: 10,
              top: 50,
              child: InkWell(
                onTap: () {
                  _togglePalette();
                },
                child: Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: _selectedColor == -1
                        ? Color.fromARGB(205, 255, 255, 255)
                        : Color(int.parse('0xff${canvasColors[_selectedCanvas][_selectedColor]}')),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: Colors.black.withOpacity(0.2),
                      width: 2,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.2),
                        blurRadius: 4,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Icon(
                    _paletteOpen ? Icons.close : Icons.brush,
                    size: 24,
                    color: (_selectedColor == -1
                        ? Color.fromARGB(205, 0, 0, 0)
                        : _getInverseColor(int.parse('0xff${canvasColors[_selectedCanvas][_selectedColor]}'))),
                  ),
                ),
              ),
            ),
            if (_paletteOpen)
              Positioned(
                bottom: 80,
                left: 10,
                right: 10,
                child: Container(
                  decoration: BoxDecoration(
                    color: Color.fromARGB(205, 255, 255, 255),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: Color.fromARGB(105, 0, 0, 0),
                      width: 2,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Color.fromARGB(205, 0, 0, 0),
                        blurRadius: 4,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.start,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    mainAxisSize: MainAxisSize.min,
                    spacing: 0,
                    children: <Widget>[
                      SizedBox(width: 3),
                      const Icon(Icons.color_lens, size: 24),
                      SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.start,
                          crossAxisAlignment: CrossAxisAlignment.center,
                          mainAxisSize: MainAxisSize.min,
                          children: <Widget>[
                            for (int i = 0; i < canvasColors[_selectedCanvas].length; i++)
                              IconButton(
                                padding: const EdgeInsets.all(0),
                                constraints: const BoxConstraints(),
                                onPressed: () {
                                  _selectColor(i);
                                },
                                style: IconButton.styleFrom(
                                  backgroundColor: Color.fromARGB(0, 0, 0, 0),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(7),
                                  ),
                                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                ),
                                icon: Container(
                                  width: 28,
                                  height: 28,
                                  margin: const EdgeInsets.all(2),
                                  decoration: BoxDecoration(
                                    color: Color(int.parse('0xff${canvasColors[_selectedCanvas][i]}')),
                                    border: Border.all(
                                      color: Colors.black.withOpacity(0.2),
                                      width: 2,
                                    ),
                                    borderRadius: BorderRadius.circular(7),
                                  ),
                                  child: const SizedBox(),
                                ),
                                iconSize: 24,
                              ),
                            ],
                        ),
                      ),
                      IconButton(
                        icon: Icon(Icons.close),
                        onPressed: () {
                          // Handle undo action
                          setState(() {
                            _paletteOpen = false;
                          });
                        },
                      ),
                      SizedBox(width: 3),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
