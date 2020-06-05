# zScanner

[![build status](https://travis-ci.org/ikem-cz/zscanner-backend-node.svg?branch=master)](https://travis-ci.org/ikem-cz/zscanner-backend-node)

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

### Request BodyParts images

```
  GET /api-zscanner/v3/bodyparts-images

  200 OK
    [
        {
            "url": "http://localhost/head.png",
            "bodyParts":
                [
                    {
                        "id": "leftEye",
                        "name": "Left eye",
                        "coordinates": [0.2, 0.2]
                    },
                    {
                        "id": "rightEye",
                        "name": "Right eye",
                        "coordinates": [0.8, 0.2]
                    }
                ]
        },
        {
            "url": "http://localhost/hand.png",
            "bodyParts":
                [
                    {
                        "id": "finger",
                        "name": "Finger",
                        "coordinates": [0.1, 0.1]
                    }
                ]
        }
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
          type: 'suggestedResult'
      },
      {
          externalId: '011116/0632',
          internalId: '124587113',
          name: 'František Machajda',
          type: 'searchResult'
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

### Upload large file

#### Start upload

```
  POST /api-zscanner/upload

  With following headers (value in metadata is base64 encoded):
    Tus-Resumable: 1.0.0
    Upload-Length: 5980
    Upload-Metadata: uploadType cGFnZQ==,relativePath bnVsbA==,name c2NvcmVzaGVldHMgKDQ4KS5wZGY=,type YXBwbGljYXRpb24vcGRm,filetype YXBwbGljYXRpb24vcGRm,filename c2NvcmVzaGVldHMgKDQ4KS5wZGY=
```
On success, there will be Location in response headers which is the endpoint for sending data

#### Write data to existing upload

PATCH request to url from Location header of POST request

```
  PATCH /api-zscanner/upload/298a1e1a0e9aed16017d7e5c607a77fd

  With following headers:
    Content-Type: application/offset+octet-stream
    Tus-Resumable: 1.0.0
    Upload-Offset: 0
  And data in Request Payload
```
