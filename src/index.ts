import { QApplication, QMainWindow, QWidget, FlexLayout, QSystemTrayIcon, QIcon, QMenu, QAction, QLineEdit, QListWidget, QListWidgetItem } from '@nodegui/nodegui';
import logo from '../assets/logox200.png';
import wallpaper from './wallpaper'
import { WallpaperCraft } from './sources/wallpaperscraft';
import { createInterval } from './utils/interval';
import { CategoriesCollection } from './categories-collection';
import { ImageStorage } from './image-storage';

const source = new WallpaperCraft()
const interval = createInterval(nextWallpaper)
const categoriesCollection = new CategoriesCollection()
const imageStorage = new ImageStorage()

async function openWindow() {
  const qApp = QApplication.instance();
  qApp.setQuitOnLastWindowClosed(false);

  const win = new QMainWindow();
  win.setWindowTitle("Dynamic wallpaper");
  win.resize(400, 300)
  win.setWindowIcon(new QIcon(logo))

  const centralWidget = new QWidget();
  centralWidget.setObjectName("myroot");
  const rootLayout = new FlexLayout();
  centralWidget.setLayout(rootLayout);

  const input = new QLineEdit();
  input.setText(String(interval.getDelay()))
  input.setPlaceholderText('Wallpaper update interval (seconds, 0 - dont update)');

  input.addEventListener('textChanged', () => {
    interval.set(+input.text() || 0)
  })

  const list = new QListWidget()

  source.getCategories().then(categories => {
    categories.forEach(c => {
      const item = new QListWidgetItem()

      item.setText(c.text);
      item.setCheckState(categoriesCollection.has(c) ? 2 : 0);
      item.setSelected(false)
      list.addItem(item)
    })

    list.addEventListener('itemChanged', (item) => {
      const checked = item.checkState() === 2
      const category = categories.find(c => c.text === item.text())

      if (!category) throw new Error('cannot find category')

      if (checked)
        categoriesCollection.add(category)
      else
        categoriesCollection.remove(category)
    })
  })

  rootLayout.addWidget(list);
  rootLayout.addWidget(input);
  win.setCentralWidget(centralWidget);
  win.setStyleSheet(
    `
      #myroot {
        background-color: white;
        height: '100%';
        padding: 3%;
      }
    `
  );
  win.show();
  (global as any).win = win
}

async function nextWallpaper() {
  const randomCategory = categoriesCollection.random()
  const { pagesCount } = await source.getCategoryDetails(randomCategory ? randomCategory : null)
  const randomPage = Math.ceil(Math.random() * pagesCount)
  
  const images = await source.getImages(randomCategory ? randomCategory : null, randomPage)

  const randomImageId = images[Math.floor(Math.random() * images.length)]

  const image = await source.downloadImage(randomImageId)
  const path = await imageStorage.saveTemporary(randomImageId, image)

  await wallpaper.set(path)
}


(async () => {
  const trayIcon = new QIcon(logo)
  const tray = new QSystemTrayIcon()
  tray.setIcon(trayIcon);
  tray.show();
  
  const menu = new QMenu()
  
  const nextAct = new QAction()
  nextAct.setText('Next wallpaper')
  nextAct.addEventListener('triggered', async () => {
    await nextWallpaper()
  })

  const saveAct = new QAction()
  saveAct.setText('Save current wallpaper')
  saveAct.addEventListener('triggered', async () => {
    const source = await wallpaper.get()

    await imageStorage.save(source)
  })
  
  const settingsAct = new QAction()
  settingsAct.setText('Settings')
  settingsAct.addEventListener('triggered', openWindow)

  const exitAct = new QAction()
  exitAct.setText('Exit')
  exitAct.addEventListener('triggered', () => {
    QApplication.instance().quit()
  })

  menu.addAction(nextAct)
  menu.addAction(saveAct)
  menu.addSeparator()
  menu.addAction(settingsAct)
  menu.addSeparator()
  menu.addAction(exitAct)
  
  tray.setContextMenu(menu);
  
  (global as any).tray = tray
})()
