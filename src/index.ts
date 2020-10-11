import { QApplication, QMainWindow, QWidget, FlexLayout, QSystemTrayIcon, QIcon, QMenu, QAction, QLineEdit, QListWidget, QListWidgetItem } from '@nodegui/nodegui';
import logo from '../assets/logox200.png';
import wallpaper from './wallpaper'
import fs from 'fs-extra'
import { basename, join } from 'path'
import { downloadImage, getCategories, getImages, initialize } from './sources/wallpaperscraft';

class State {
  static categories: { id: string }[] = []
  static interval: number = 0

  static getRandomCategory(): { id: string } | undefined {
    return this.categories[Math.floor(Math.random() * this.categories.length)]
  }
}


let timeout: NodeJS.Timeout | null = null

async function startAutoUpdate() {
  timeout && clearTimeout(timeout)

  if (State.interval !== 0) {
    timeout = setTimeout(async () => {
      await nextWallpaper()
      startAutoUpdate()
    }, State.interval * 1000)
  }
}


async function openWindow() {
  const qApp = QApplication.instance();
  qApp.setQuitOnLastWindowClosed(false);

  const categories = await getCategories()

  const win = new QMainWindow();
  win.setWindowTitle("Dynamic wallpaper");
  win.resize(400, 300)
  win.setWindowIcon(new QIcon(logo))

  const centralWidget = new QWidget();
  centralWidget.setObjectName("myroot");
  const rootLayout = new FlexLayout();
  centralWidget.setLayout(rootLayout);

  const input = new QLineEdit();
  input.setText(String(State.interval))
  input.setPlaceholderText('Wallpaper update interval (seconds, 0 - dont update)');

  input.addEventListener('textChanged', () => {
    State.interval = +input.text() || 0
    startAutoUpdate()
  })

  const list = new QListWidget()


  categories.forEach(c => {
    const item = new QListWidgetItem()

    item.setText(c.text);
    item.setCheckState(State.categories.some(cat => cat.id === c.id) ? 2 : 0);
    item.setSelected(false)
    list.addItem(item)
  })

  list.addEventListener('itemChanged', (item) => {
    console.log('itemChanged', item.text());
    
    const checked = item.checkState() === 2
    const category = categories.find(c => c.text === item.text())

    if (!category) throw new Error('cannot find category')

    if (checked)
      State.categories.push({ id: category.id })
    else
      State.categories.splice(State.categories.findIndex(c => c.id === category.id), 1)
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
  const randomCategory = State.getRandomCategory()
  const { pagesCount } = await initialize(randomCategory ? randomCategory.id : null)
  const randomPage = Math.ceil(Math.random() * pagesCount)
  
  const images = await getImages(randomCategory ? randomCategory.id : null, randomPage)

  const randomImageId = images[Math.floor(Math.random() * images.length)]

  const image = await downloadImage(randomImageId)

  const cwd = process.cwd()

  await fs.ensureDir(join(cwd, 'tmp'))
  await fs.writeFile(join(cwd, 'tmp', randomImageId + '.jpg'), image)

  await wallpaper.set(join(cwd, 'tmp', randomImageId + '.jpg'))
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
    const cwd = process.cwd()

    await fs.ensureDir(join(cwd, 'saved'))
    const source = await wallpaper.get()
    await fs.copyFile(source, join(cwd, 'saved', basename(source)))
  })
  
  const settingsAct = new QAction()
  settingsAct.setText('Settings')
  settingsAct.addEventListener('triggered', () => {
    openWindow()
  })

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



