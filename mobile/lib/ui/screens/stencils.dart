import 'package:flutter/material.dart';
import 'dart:typed_data';
import '../../services/canvas.dart';
import 'dart:convert';
import 'package:flutter/services.dart';
import 'package:image/image.dart' as img;
import 'package:starknet/starknet.dart';
import 'package:http/http.dart' as http;
import '../../services/stencil.dart';

class StencilsPage extends StatefulWidget {
  const StencilsPage({
    super.key,
    required this.title,
    this.canvasImgs,
    required this.getStarknetAccount,
    required this.selectedStencils,
    required this.selectStencil,
  });

  final String title;
  final List<Uint8List>? canvasImgs;
  final Account? Function() getStarknetAccount;
  final List<int> selectedStencils;
  final Function(int, int, StencilItem?) selectStencil;

  @override
  State<StencilsPage> createState() => _StencilsPageState();
}

class _StencilsPageState extends State<StencilsPage> {
  @override
  void initState() {
    super.initState();
    if (widget.canvasImgs != null) {
      canvasImgs = widget.canvasImgs!;
    } else {
      canvasImgs = [];
    }
    _getStencils(selectedFilter, selectedCanvas, 1);
  }
  List<Uint8List> canvasImgs = [];
  
  List<String> filterTypes = [
    'Favorites',
    'Top',
    'New',
  ];
  int selectedFilter = 0;
  int selectedCanvas = 0;

  _selectCanvas(int index) {
    _getStencils(selectedFilter, index, 0);
    setState(() {
      _page = 1;
      selectedCanvas = index;
    });
  }

  _selectFilter(int index) {
    _getStencils(index, selectedCanvas, 0);
    setState(() {
      _page = 1;
      selectedFilter = index;
    });
  }

  _favoriteStencil(int index) {
    setState(() {
      if (stencils[index].favorited) {
        stencils[index].favorites--;
      } else {
        stencils[index].favorites++;
      }
      stencils[index].favorited = !stencils[index].favorited;
    });
  }

  _nextPage() {
    _getStencils(selectedFilter, selectedCanvas, _page + 1);
    setState(() {
      _page++;
    });
  }

  List<StencilItem> stencils = [];
  _getStencilImage(String hash) async {
    String url = 'https://api.art-peace.net/stencils/stencil-$hash.png';
    final response = await http.get(Uri.parse(url));
    if (response.statusCode == 200) {
      // Decode the image data
      Uint8List uint8list = response.bodyBytes;
      // Convert the image data to a format that can be displayed
      img.Image? image = img.decodeImage(uint8list);
      if (image != null) {
        uint8list = Uint8List.fromList(img.encodePng(image));
      }
      // Return the image data as a Uint8List
      return uint8list;
    } else {
      return Uint8List(0);
    }
  }
  List<String> filterPaths = [
    'get-favorite-stencils',
    'get-top-stencils',
    'get-new-stencils',
  ];
  String account = '0431ce46d35e25713fc63d26f9195dd2aa1873fc1eaca24e4883919b16777005';
  int _pageLength = 24;
  int _page = 1;
  _getStencils(int filter, int selectedCanvas, int page) async {
    List<StencilItem> newStencils = [];
    String url = 'https://api.art-peace.net/${filterPaths[filter]}?address=$account&pageLength=$_pageLength&page=$page&worldId=${selectedCanvas + canvasOffset}';
    final response = await http.get(Uri.parse(url));
    if (response.statusCode == 200) {
      final data = response.body;
      // Parse the JSON data
      final parsedData = data.substring(data.indexOf('['), data.lastIndexOf(']') + 1);
      final List<dynamic> jsonData = json.decode(parsedData);
      // Convert the JSON data to a list of StencilItem objects
      for (var item in jsonData) {
        final stencil = StencilItem(
          stencilId: item['stencilId'],
          worldId: item['worldId'],
          name: item['name'],
          hash: item['hash'],
          width: item['width'],
          height: item['height'],
          position: item['position'],
          favorites: item['favorites'],
          favorited: item['favorited'],
          image: Uint8List(0),
        );
        newStencils.add(stencil);
      }
    } else {
      throw Exception('Failed to load stencils');
    }
    setState(() {
      if (page == 0) {
        stencils = newStencils;
      } else {
        stencils.addAll(newStencils);
      }
    });
    for (var i = 0; i < stencils.length; i++) {
      final newImg = await _getStencilImage(stencils[i].hash);
      setState(() {
        stencils[i].image = newImg;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Color.fromARGB(255, 205, 205, 205), 
      body: Padding(
        padding: EdgeInsets.only(top: 60, left: 10, right: 10),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '${canvasNames[selectedCanvas]} Stencils',
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                DropdownButton<String>(
                  icon: const Icon(Icons.filter_list),
                  iconSize: 24,
                  elevation: 16,
                  underline: Container(
                    height: 1,
                    color: Colors.grey,
                  ),
                  style: const TextStyle(
                    color: Colors.black,
                    fontSize: 16,
                    letterSpacing: 1,
                  ),
                  dropdownColor: Colors.white,
                  borderRadius: BorderRadius.circular(10),
                  value: filterTypes[selectedFilter],
                  items: filterTypes.map((String value) {
                    return DropdownMenuItem<String>(
                      value: value,
                      child: Text(value),
                    );
                  }).toList(),
                  onChanged: (String? newValue) {
                    setState(() {
                      _selectFilter(filterTypes.indexOf(newValue!));
                    });
                  },
                ),
              ],
            ),
            const SizedBox(height: 5),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: <Widget>[
                  for (int i = 0; i < canvasImgs.length; i++)
                    Container(
                      margin: const EdgeInsets.only(left: 3, right: 3),
                      decoration: BoxDecoration(
                        border: Border.all(color: selectedCanvas == i ? Colors.blue : Colors.grey, width: 2),
                        borderRadius: BorderRadius.all(Radius.circular(5)),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.center,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const SizedBox(height: 3),
                          IconButton(
                            icon: Image.memory(
                              canvasImgs[i],
                              width: 102.4,
                              height: 76.8,
                              gaplessPlayback: true,
                            ),
                            padding: const EdgeInsets.only(left: 3, right: 3),
                            onPressed: () => _selectCanvas(i),
                          ),
                          Text(
                            canvasNames[i],
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 3),
                        ]
                      ),
                    ),
                ],
              ),
            ),
            Container(
              margin: EdgeInsets.only(top: 3, bottom: 3),
              height: 2,
              color: Colors.grey,
              padding: const EdgeInsets.only(left: 5, right: 5),
            ),
            Expanded(
              child: GridView.builder(
                padding: const EdgeInsets.only(top: 0, bottom: 100),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 3,
                  childAspectRatio: 1.0,
                  crossAxisSpacing: 5,
                  mainAxisSpacing: 5,
                ),
                itemCount: stencils.length,
                itemBuilder: (context, index) {
                  return Container(
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.grey, width: 1),
                      borderRadius: BorderRadius.circular(10),
                      image: DecorationImage(
                        image: MemoryImage(stencils[index].image),
                        fit: BoxFit.contain,
                        filterQuality: FilterQuality.none,
                      ),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.end,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          margin: const EdgeInsets.only(bottom: 3, right: 3),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.end,
                            crossAxisAlignment: CrossAxisAlignment.center,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              IconButton(
                                onPressed: () {
                                  widget.selectStencil(selectedCanvas, index, stencils[index]);
                                },
                                icon: const Icon(
                                  Icons.brush,
                                  color: Colors.black,
                                  size: 18,
                                ),
                                style: OutlinedButton.styleFrom(
                                  padding: const EdgeInsets.all(5),
                                  minimumSize: const Size(0, 0),
                                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                  backgroundColor: index == widget.selectedStencils[selectedCanvas] ? Color.fromARGB(200, 0, 0, 255) : Color.fromARGB(200, 255, 255, 255),
                                  shape: const RoundedRectangleBorder(
                                    borderRadius: BorderRadius.all(Radius.circular(10)),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 3),
                              OutlinedButton.icon(
                                onPressed: () {
                                  _favoriteStencil(index);
                                },
                                icon: Icon(
                                  stencils[index].favorited ? Icons.favorite : Icons.favorite_border,
                                  color: stencils[index].favorited ? Colors.red : Colors.black,
                                  size: 18,
                                ),
                                label: Text(
                                  '${stencils[index].favorites}',
                                  style: const TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                iconAlignment: IconAlignment.end,
                                style: OutlinedButton.styleFrom(
                                  padding: const EdgeInsets.all(5),
                                  minimumSize: const Size(0, 0),
                                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                  backgroundColor: Color.fromARGB(200, 255, 255, 255),
                                  shape: const RoundedRectangleBorder(
                                    borderRadius: BorderRadius.all(Radius.circular(10)),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
            if (stencils.length % _pageLength == 0 && stencils.isNotEmpty)
              ElevatedButton(
                onPressed: _nextPage,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.all(10),
                  minimumSize: const Size(0, 0),
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  backgroundColor: Color.fromARGB(150, 255, 255, 255),
                  shape: const RoundedRectangleBorder(
                    borderRadius: BorderRadius.all(Radius.circular(7)),
                  ),
                ),
                child: const Text('more...'),
              ),
            const SizedBox(height: 80),
          ],
        ),
      ),
    );
  }
}

