import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image/image.dart' as img;

import '../../services/canvas.dart';
import '../footer.dart';

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
                          canvasImgs[0],
                          width: canvasSizes[0][0].toDouble(),
                          height: canvasSizes[0][1].toDouble(),
                          filterQuality: FilterQuality.none,
                          gaplessPlayback: true,
                        ),
                      ),
                      for (int i = 1; i < canvasImgs.length; i++)
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
