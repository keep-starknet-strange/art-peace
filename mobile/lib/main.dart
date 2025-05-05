import 'package:flutter/material.dart';
import 'dart:typed_data';

import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:image/image.dart' as img;
import '../../services/canvas.dart';

import './ui/screens/home.dart';
import './ui/screens/stencils.dart';
import './ui/footer.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized(); // Ensure Flutter is initialized
  try {
    await dotenv.load(fileName: ".env"); // Load environment variables
  } catch (e) {
    throw Exception('Error loading .env file: $e'); // Print error if any
  }
  runApp(MyApp());
}

class MyApp extends StatefulWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  @override
  void initState() {
    super.initState();
    // Initialize the canvas images
    for (int i = 0; i < canvasIds.length; i++) {
      _getCanvas(i);
    }
  }

  _getCanvas(int id) async {
    Uint8List canvasImg = await getCanvasImage(canvasIds[id]);
    setState(() {
      canvasImgs[id] = canvasImg;
    });
  }

  late List<TabItem> tabs = [
    TabItem(
      title: 'Canvas',
      icon: Image(
        image: AssetImage('assets/icons/canvas.png'),
        width: 40,
        height: 40,
      ),
      page: HomePage(title: 'Canvas', canvasImgs: canvasImgs),
    ),
    TabItem(
      title: 'Stencils',
      icon: Image(
        image: AssetImage('assets/icons/stencil.png'),
        width: 40,
        height: 40,
      ),
      page: StencilsPage(title: 'Stencils', canvasImgs: canvasImgs),
    ),
    TabItem(
      title: 'Leaderboard',
      icon: Image(
        image: AssetImage('assets/icons/leaderboard.png'),
        width: 40,
        height: 40,
      ),
      page: Center(child: Text('Leaderboard')),
    ),
    TabItem(
      title: 'Profile',
      icon: Image(
        image: AssetImage('assets/icons/user.png'),
        width: 40,
        height: 40,
      ),
      page: Center(child: Text('Profile')),
    ),
    TabItem(
      title: 'Settings',
      icon: Image(
        image: AssetImage('assets/icons/settings.png'),
        width: 40,
        height: 40,
      ),
      page: Center(child: Text('Settings')),
    ),
  ];

  int _currentTab = 0;
  void _onTabTapped(int index) {
    setState(() {
      _currentTab = index;
    });
  }

  late List<Uint8List> canvasImgs = canvasIds.map((id) {
    return img.encodePng(img.Image(height: getCanvasHeight(id), width: getCanvasWidth(id)));
  }).toList();

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'art/peace',
      theme: ThemeData(
        // This is the theme of your application.
        //
        // TRY THIS: Try running your application with "flutter run". You'll see
        // the application has a purple toolbar. Then, without quitting the app,
        // try changing the seedColor in the colorScheme below to Colors.green
        // and then invoke "hot reload" (save your changes or press the "hot
        // reload" button in a Flutter-supported IDE, or press "r" if you used
        // the command line to start the app).
        //
        // Notice that the counter didn't reset back to zero; the application
        // state is not lost during the reload. To reset the state, use hot
        // restart instead.
        //
        // This works for code too, not just values: Most code changes can be
        // tested with just a hot reload.
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
        useMaterial3: true,
      ),
      home: Stack(
        children: <Widget>[
          Scaffold(
            body: tabs[_currentTab].page,
          ),
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Footer(
              tabs: tabs,
              currentIndex: _currentTab,
              onTap: _onTabTapped,
            ),
          )
        ],
      ),
    );
  }
}
