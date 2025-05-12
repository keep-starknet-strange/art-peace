import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'dart:typed_data';

import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:wallet_kit/wallet_kit.dart' as wallet_kit;
import 'package:starknet/starknet.dart';
import 'package:image/image.dart' as img;
import 'package:audioplayers/audioplayers.dart';

import '../../services/canvas.dart';
import '../../services/stencil.dart';
import './ui/screens/home.dart';
import './ui/screens/stencils.dart';
import './ui/screens/leaderboard.dart';
import './ui/screens/account.dart';
import './ui/footer.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized(); // Ensure Flutter is initialized
  try {
    await dotenv.load(fileName: ".env"); // Load environment variables
  } catch (e) {
    throw Exception('Error loading .env file: $e'); // Print error if any
  }
  wallet_kit.WalletKit().init(
    accountClassHash: dotenv.env['ACCOUNT_CLASS_HASH'] as String,
    rpc: dotenv.env['RPC'] as String,
  );
  await Hive.initFlutter();

  runApp(const ProviderScope(child: MyApp()));
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
    // Play music
    playMusic();
  }

  final List<String> songs = [
    'music/chiptune-hard-boss-mode-218071.mp3',
    'music/falselyclaimed-bit-beats-3-168873.mp3',
    'music/neon-gaming-128925.mp3',
    'music/pixel-dreams-259187.mp3',
    'music/rasta-8bit-174443.mp3'
  ];

  final musicPlayer = AudioPlayer();
  double musicVolume = 0.5;
  void playNextSong() async {
    final randomIndex = (DateTime.now().millisecondsSinceEpoch / 1000).floor() % songs.length;
    final selectedSong = songs[randomIndex];
    await musicPlayer.setSource(AssetSource(selectedSong));
    await musicPlayer.setVolume(musicVolume);
    await musicPlayer.resume();
  }
  void playMusic() async {
    musicPlayer.onPlayerComplete.listen((_) {
      playNextSong();
    });
    playNextSong();
  }
  void muteMusic() async {
    setState(() {
      musicVolume = 0.0;
    });
    await musicPlayer.setVolume(musicVolume);
  }
  void unmuteMusic() async {
    setState(() {
      musicVolume = 0.5;
    });
    await musicPlayer.setVolume(musicVolume);
  }

  final List<String> soundEffects = [
    'sounds/click.wav',
    'sounds/click-2.wav',
    'sounds/notif.wav',
    'sounds/shutter.wav',
    'sounds/soft-click.wav',
    'sounds/soft-click-2.wav',
    'sounds/unlock.wav'
  ];
  double soundEffectVolume = 0.5;
  void playSoundEffect(int index) async {
    if (index < 0 || index >= soundEffects.length) {
      print('Invalid sound effect index: $index');
      return;
    }
    final sound = soundEffects[index];
    final player = AudioPlayer();
    await player.setSource(AssetSource(sound));
    await player.setVolume(soundEffectVolume);
    await player.resume();
  }
  void muteSoundEffects() async {
    setState(() {
      soundEffectVolume = 0.0;
    });
  }
  void unmuteSoundEffects() async {
    setState(() {
      soundEffectVolume = 0.5;
    });
  }

  _getCanvas(int id) async {
    Uint8List canvasImg = await getCanvasImage(canvasIds[id]);
    setState(() {
      canvasImgs[id] = canvasImg;
    });
  }

  Account? starknetAccount;
  void setStarknetAccount(Account account) {
    print('Updating account: $account');
    setState(() {
      starknetAccount = account;
    });
  }
  Account? getStarknetAccount() {
    return starknetAccount;
  }

  late List<TabItem> tabs = [
    TabItem(
      title: 'Canvas',
      icon: Image(
        image: AssetImage('assets/icons/canvas.png'),
        width: 40,
        height: 40,
      ),
      page: HomePage(title: 'Canvas', canvasImgs: canvasImgs, getStarknetAccount: getStarknetAccount, selectedStencils: selectedStencils, playSoundEffect: playSoundEffect, stencils: stencils),
    ),
    TabItem(
      title: 'Stencils',
      icon: Image(
        image: AssetImage('assets/icons/stencil.png'),
        width: 40,
        height: 40,
      ),
      page: StencilsPage(title: 'Stencils', canvasImgs: canvasImgs, selectedStencils: selectedStencils, getStarknetAccount: getStarknetAccount, selectStencil: selectStencil),
    ),
    TabItem(
      title: 'Leaderboard',
      icon: Image(
        image: AssetImage('assets/icons/leaderboard.png'),
        width: 40,
        height: 40,
      ),
      page: LeaderboardPage(title: 'Leaderboard', canvasImgs: canvasImgs, getStarknetAccount: getStarknetAccount),
    ),
    TabItem(
      title: 'Profile',
      icon: Image(
        image: AssetImage('assets/icons/user.png'),
        width: 40,
        height: 40,
      ),
      page: AccountPage(setStarknetAccount: setStarknetAccount), 
    ),
    TabItem(
      title: 'Settings',
      icon: Image(
        image: AssetImage('assets/icons/settings.png'),
        width: 40,
        height: 40,
      ),
      page: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.center,
        mainAxisSize: MainAxisSize.max,
        children: [
          Text('Settings'),
          ElevatedButton(
            onPressed: () {
              if (musicVolume == 0.0) {
                unmuteMusic();
              } else {
                muteMusic();
              }
            },
            child: Text(
              musicVolume == 0.0 ? 'Unmute Music' : 'Mute Music',
            ),
          ),
          ElevatedButton(
            onPressed: () {
              if (soundEffectVolume == 0.0) {
                unmuteSoundEffects();
              } else {
                muteSoundEffects();
              }
            },
            child: Text(
              soundEffectVolume == 0.0 ? 'Unmute Sound Effects' : 'Mute Sound Effects',
            ),
          ),
        ],
      ),
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

  late List<int> selectedStencils = List.generate(canvasIds.length, (index) => -1);
  late List<StencilItem?> stencils = List.generate(canvasIds.length, (index) => null);
  void selectStencil(int canvasId, int stencilId, StencilItem? stencil) {
    setState(() {
      selectedStencils[canvasId] = stencilId;
      stencils[canvasId] = stencil;
    });
  }

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
