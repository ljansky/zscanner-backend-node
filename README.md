# zScanner

## API

### Request Document Types

```
  GET /api-zscanner/v3/documenttypes

  200 OK
  [
      {
          mode: 'doc',
          display: 'Rodný list',
          type: 'birthcertificate',
      },
      {
          mode: 'doc',
          display: 'Občanský průkaz',
          type: 'nationalid',
      },
      ...
  ]
```

```
  curl -v -v \
       http://localhost:10805/api-zscanner/v3/documenttypes
```

### Request Folders by Query

```
  GET /api-zscanner/v3/folders/search?query=mach

  200 OK
  [
      {
          externalId: '925221/9449',
          internalId: '124587112',
          name: 'Radana Macháčková',
      },
      {
          externalId: '011116/0632',
          internalId: '124587113',
          name: 'František Machajda',
      },
      ...
  ]
```

```
  curl -v -v \
       http://localhost:10805/api-zscanner/v3/folders/search?query=ova
```

### Request Folder by Barcode

```
  GET /api-zscanner/v3/folders/decode?query=124587112

  200 OK
  {
      externalId: '925221/9449',
      internalId: '124587112',
      name: 'Radana Macháčková',
  }
```

```
  curl -v -v \
       http://localhost:10805/api-zscanner/v3/folders/decode?query=124587154
```

### Submit Document Summary

```
  POST /api-zscanner/v3/documents/summary
  {
    "correlation": "1234",
    "folderInternalId": "124587112",
    "documentMode": "doc",
    "documentType": "birthcertificate",
    "pages": 1,
    "datetime": "2018-02-12T23:12:30Z",
    "name": "Rodny list",
    "notes": "Poznamky"
  }

  200 OK
```

```
  curl -v -v -XPOST \
       -H 'Content-Type: application-json' \
       --data '{
         "correlation": "1234",
         "folderInternalId": "124587112",
         "documentMode": "doc",
         "documentType": "birthcertificate",
         "pages": 1,
         "datetime": "2018-02-12T23:12:40Z",
         "name": "Rodny list",
         "notes": "Poznamky"
       }' \
       http://localhost:10805/api-zscanner/v3/documents/summary
```

### Submit Document Page

```
  POST /api-zscanner/v3/documents/page
  Content-Type: multipart/form-data

  With the following parameters:
    correlation: "1234",
    page: 0,
    page (file): ...contents-of-the-image...

  200 OK
```

```
  curl -v -v -XPOST \
       -F "correlation=1234" \
       -F "page=0" \
       -F "page=@image.jpg" \
       http://localhost:10805/api-zscanner/v3/documents/page
```
