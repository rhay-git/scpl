
## Get Diffbot Article from Webpage / GetDiffbotArticlefromWebpage (internally `is.workflow.actions.getarticle`)


## description

### summary

Gets article details, including body text, author, publish date, and more, from every URL passed into the action.


### note

Use a Get Details of Diffbot Article action immediately after this action to get specific details about the article. This action only supports getting one article from each URL.

Powered by Diffbot (diffbot.com)


### usage
```
GetDiffbotArticlefromWebpage 
```

### arguments

---



---

### source json (for developers)

```json
{
	"ActionClass": "WFCoercionAction",
	"ActionKeywords": [
		"web",
		"pages",
		"author",
		"word",
		"excerpt",
		"title",
		"content",
		"body",
		"published"
	],
	"Category": "Web",
	"CoercionItemClass": "WFArticleContentItem",
	"CreationDate": "2015-02-13T08:00:00.000Z",
	"Description": {
		"DescriptionNote": "Use a Get Details of Diffbot Article action immediately after this action to get specific details about the article. This action only supports getting one article from each URL.\n\nPowered by Diffbot (diffbot.com)",
		"DescriptionSummary": "Gets article details, including body text, author, publish date, and more, from every URL passed into the action."
	},
	"IconName": "DownloadArticle.png",
	"Input": {
		"Multiple": true,
		"Required": true,
		"Types": [
			"WFURLContentItem"
		]
	},
	"InputPassthrough": false,
	"Name": "Get Diffbot Article from Webpage",
	"Output": {
		"OutputName": "Article",
		"Types": [
			"WFArticleContentItem"
		]
	},
	"ShortName": "Get Article",
	"Subcategory": "Articles"
}
```
