import 'dart:typed_data';

class StencilItem {
  StencilItem({
    required this.stencilId,
    required this.worldId,
    required this.name,
    required this.hash,
    required this.width,
    required this.height,
    required this.position,
    required this.favorites,
    required this.favorited,
    required this.image,
  });

  final int stencilId;
  final int worldId;
  final String name;
  final String hash;
  final int width;
  final int height;
  final int position;
  int favorites;
  bool favorited;
  Uint8List image;
}


