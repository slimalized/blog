# `media` ディレクトリ

`media`ディレクトリは、各ブログ投稿（post）で使用する画像や動画ファイルのオリジナルをローカルに保管するための場所です。

当サイトでは、実際に表示される画像や動画は主にCloudflare R2から読み込まれます。そのため、`media`ディレクトリ内のファイルは使用せず、公開されることもありません。しかし、R2への再アップロードが必要になった場合などに備え、一応オリジナルのファイルをここに保管しています。

`bun run post:create`コマンドで新しい投稿を作成すると、その記事に対応するサブディレクトリが`media/posts`内に生成されます。これらのサブディレクトリはGitの管理対象外です。

```shell
# 構成例
media/
└── posts/
    ├── README.md
    ├── markdown-sample/
    │   ├── image1.avif
    │   └── image2.avif
    └── hello-world/
        └── hello-world.avif
```

```markdown
<!-- markdown内での参照例。後でR2への参照に変換される。 -->
![image1](/media/posts/markdown-sample/image1.avif)
```
