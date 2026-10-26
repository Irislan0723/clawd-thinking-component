# 桌宠素材接入

Whisper 站内版使用了 Clawd on Desk 的四个动画 SVG，具体文件名和校验值见 `desktop-artwork-manifest.json`

公开组件没有包含这些素材，也没有复制其 AGPL 桌宠程序代码，默认动画由 Creative Components 的 Canvas 引擎绘制

上游把程序代码和美术素材分开授权，官方说明：

- https://github.com/rullerzhou-afk/clawd-on-desk#license
- https://github.com/rullerzhou-afk/clawd-on-desk/blob/main/assets/LICENSE
- 随本包保存的本地素材许可副本：`../licenses/clawd-on-desk-artwork.txt`

未经相应授权，不应把站内使用的 SVG 直接作为公开仓库素材、截图或 GitHub Pages 演示内容转载；署名本身不会替代素材再分发授权

如果已经取得适当授权，可以传入以下映射

```js
const thinking = createClawdThinking(container, {
  assets: {
    sleep: '/my-authorized-art/sleep.svg',
    think: '/my-authorized-art/think.svg',
    ultra: '/my-authorized-art/ultra.svg',
    dizzy: '/my-authorized-art/dizzy.svg'
  }
});
```

这些名称对应组件动作，不是自动获取上游文件的地址；未提供的动作会继续使用 Canvas 引擎

组件保留了 SVG 作为外部图片文档加载的方式，因此文件内部的动画仍可运行，也保留咬一口时的 SVG 遮罩

若公开上传自己获授权的素材，应同时附上授权范围、作者署名及相应许可证，并修改打包清单显式加入文件

Clawd 角色本身属于 Anthropic，两个上游项目和本二改版都不是 Anthropic 官方产品
