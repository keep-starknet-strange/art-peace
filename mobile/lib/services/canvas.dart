import 'dart:async';
import 'dart:typed_data';
import 'package:image/image.dart' as img;
import 'package:http/http.dart' as http;

const int canvasOffset = 13;
const List<int> canvasIds = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25];
const List<List<String>> canvasColors = [
    [ "fafafa", "080808", "ba2112", "ff403d", "ff7714", "ffd115", "f5ff05", "199f27", "00ef3f", "152665", "1542ff", "5cfffe", "a13dff", "ff7ad7", "c1d9e6", "895129" ],
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
const List<String> canvasNames = [
  "art/peace",
  "Brothers",
  "Ducks Everywhere",
  "Realms",
  "Orange Corner",
  "The Void",
  "Wolf Pack League",
  "ETH Maxi",
  "Bitcoin Maxi",
  "Stwo Corner",
  "Starknet DeFi",
  "Starknet Gamers",
  "Meme Corner",
];
const List<List<int>> canvasSizes = [
  [528, 396],
  [256, 192],
  [256, 192],
  [256, 192],
  [256, 192],
  [256, 192],
  [256, 192],
  [256, 192],
  [256, 192],
  [256, 192],
  [256, 192],
  [256, 192],
  [256, 192],
];

Future<Uint8List> getCanvasImage(int canvasId) async {
  String url = 'https://api.art-peace.net/get-world-canvas?worldId=$canvasId';
  final response = await http.get(Uri.parse(url));
  // Interpret the response body as a Uint8List using the above typescript code
  Uint8List imageBytes = response.bodyBytes;
  // Convert the Uint8List to an image
  int width = getCanvasWidth(canvasId);
  int height = getCanvasHeight(canvasId);
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
      return Uint8List(0);
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
  return img.encodePng(image);
}

int getCanvasWidth(int canvasId) {
  return canvasSizes[canvasId - canvasOffset][0];
}
int getCanvasHeight(int canvasId) {
  return canvasSizes[canvasId - canvasOffset][1];
}
