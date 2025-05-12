import 'package:flutter/material.dart';

class TabItem {
  final String title;
  final Image icon;
  final Widget page;

  TabItem({required this.title, required this.icon, required this.page});
}

class Footer extends StatelessWidget {
  const Footer({super.key, this.tabs, this.currentIndex, this.onTap});

  final List<TabItem>? tabs;
  final int? currentIndex;
  final Function(int)? onTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        color: Color.fromARGB(225, 240, 240, 240),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.3),
            blurRadius: 10,
            offset: Offset(0, 4), // changes position of shadow
          ),
        ],
        border: Border.all(
          color: Color.fromARGB(215, 100, 100, 100),
          width: 2,
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: tabs!.map((tab) {
          return IconButton(
            icon: tab.icon,
            onPressed: () {
              if (onTap != null) {
                onTap!(tabs!.indexOf(tab));
              }
            },
            color: currentIndex == tabs!.indexOf(tab)
                ? Colors.blue
                : Colors.black,
          );
        }).toList(),
      ),
    );
  }
}
