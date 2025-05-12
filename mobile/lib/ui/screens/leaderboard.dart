import 'package:flutter/material.dart';
import 'dart:typed_data';
import 'dart:convert';
import 'package:starknet/starknet.dart';
import '../../services/canvas.dart';
import 'package:http/http.dart' as http;

class LeaderboardEntry {
  final String name;
  final int score;

  LeaderboardEntry({
    required this.name,
    required this.score,
  });
}

class LeaderboardPage extends StatefulWidget {
  const LeaderboardPage({
    super.key,
    required this.title,
    required this.canvasImgs,
    required this.getStarknetAccount
  });

  final String title;
  final List<Uint8List> canvasImgs;
  final Account? Function() getStarknetAccount;

  @override
  State<LeaderboardPage> createState() => _LeaderboardPageState();
}

class _LeaderboardPageState extends State<LeaderboardPage> {
  @override
  void initState() {
    super.initState();
    _getEntries(selectedFilter, selectedCanvas, 1);
  }
  
  List<String> filterTypes = [
    'Players',
    'Worlds',
    'World'
  ];
  int selectedFilter = 0;
  int selectedCanvas = 0;

  _selectCanvas(int index) {
    _getEntries(selectedFilter, index, 1);
    setState(() {
      _page = 1;
      selectedCanvas = index;
    });
  }

  _selectFilter(int index) {
    _getEntries(index, selectedCanvas, 1);
    setState(() {
      _page = 1;
      selectedFilter = index;
    });
  }

  _nextPage() {
    _getEntries(selectedFilter, selectedCanvas, _page + 1);
    setState(() {
      _page++;
    });
  }

  List<String> filterPaths = [
    'leaderboard-pixels',
    'leaderboard-worlds',
    'leaderboard-pixels-world'
  ];

  List<LeaderboardEntry> entries = [];
  int _pageLength = 24;
  int _page = 1;
  _getEntries(int filter, int selectedCanvas, int page) async {
    List<LeaderboardEntry> newEntries = [];
    // Cutoff time is the last 10 AM UTC of the day in unix time
    DateTime now = DateTime.now().toUtc();
    DateTime cutoffTime = DateTime(now.year, now.month, now.day, 10);
    if (now.hour < 10) {
      cutoffTime = cutoffTime.subtract(const Duration(days: 1));
    }
    int cutoffTimeUnix = (cutoffTime.millisecondsSinceEpoch / 1000).round();
    String url = 'https://api.art-peace.net/${filterPaths[filter]}?pageLength=$_pageLength&page=$page&worldId=${selectedCanvas + canvasOffset}&timeCutoff=$cutoffTimeUnix';
    final response = await http.get(Uri.parse(url));
    if (response.statusCode == 200) {
      final data = response.body;
      final parsedData = data.substring(data.indexOf('['), data.lastIndexOf(']') + 1);
      final List<dynamic> jsonData = json.decode(parsedData);
      for (var item in jsonData) {
        final entry = LeaderboardEntry(
          name: item['key'],
          score: item['score'],
        );
        newEntries.add(entry);
      }
    } else {
      throw Exception('Failed to load leaderboard');
    }
    setState(() {
      if (page == 1) {
        entries = newEntries;
      } else {
        entries.addAll(newEntries);
      }
    });
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
                  widget.title,
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
                  onChanged: (String? newValue) {
                    _selectFilter(filterTypes.indexOf(newValue!));
                  },
                  items: filterTypes.map<DropdownMenuItem<String>>((String value) {
                    return DropdownMenuItem<String>(
                      value: value,
                      child: Text(value),
                    );
                  }).toList(),
                ),
              ],
            ),
            const SizedBox(height: 10),
            // Show canvas images
            if (selectedFilter == 2) 
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: <Widget>[
                    for (int i = 0; i < widget.canvasImgs.length; i++)
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
                                widget.canvasImgs[i],
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
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Name',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Text(
                  'Score',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            // Show leaderboard entries
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.only(top: 0, bottom: 100),
                physics: const AlwaysScrollableScrollPhysics(),
                shrinkWrap: true,
                itemCount: entries.length,
                itemBuilder: (context, index) {
                  return ListTile(
                    title: selectedFilter == 1
                        ? Text(entries[index].name)
                        : Text('0x${entries[index].name.substring(0, 4)}...${entries[index].name.substring(entries[index].name.length - 4)}'),
                    trailing: Text(entries[index].score.toString()),
                    leading: Text(
                      (index + 1).toString(),
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    tileColor: index % 2 == 0 ? Color.fromARGB(225, 250, 250, 250) : const Color.fromARGB(225, 230, 230, 230),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
