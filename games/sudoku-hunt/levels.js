/* 한집한냥 level list. Coordinates are 1-indexed (row 1, col 1 = top left).
   Frozen from seed 20261028. 01–02 match the design. 03–08 use hand-drawn regions.
   09–24 are generator-frozen. Level 24 was not hand-drawn; its X count is the
   nearest unique one-branch board inside the size cap, not the X×4 target. */
window.SUDOKU_HUNT_LEVELS = [
  {
    "id": "01",
    "size": 4,
    "adjacent": false,
    "regions": [
      "AABB",
      "AABB",
      "CCDD",
      "CCDD"
    ],
    "solution": [
      [
        2,
        1
      ],
      [
        1,
        3
      ],
      [
        4,
        2
      ],
      [
        3,
        4
      ]
    ],
    "givens": [
      [
        1,
        3
      ],
      [
        2,
        1
      ],
      [
        3,
        4
      ]
    ],
    "excludes": [],
    "halves": [],
    "decoys": [],
    "difficulty": 1,
    "source": "hand"
  },
  {
    "id": "02",
    "size": 4,
    "adjacent": true,
    "regions": [
      "AABB",
      "AABB",
      "CCDD",
      "CCDD"
    ],
    "solution": [
      [
        1,
        2
      ],
      [
        2,
        4
      ],
      [
        3,
        1
      ],
      [
        4,
        3
      ]
    ],
    "givens": [
      [
        1,
        2
      ],
      [
        2,
        4
      ]
    ],
    "excludes": [
      [
        4,
        1
      ]
    ],
    "halves": [],
    "decoys": [],
    "difficulty": 1,
    "source": "hand"
  },
  {
    "id": "03",
    "size": 4,
    "adjacent": true,
    "regions": [
      "AABB",
      "AABB",
      "CCDD",
      "CCDD"
    ],
    "solution": [
      [
        1,
        2
      ],
      [
        2,
        4
      ],
      [
        3,
        1
      ],
      [
        4,
        3
      ]
    ],
    "givens": [
      [
        1,
        2
      ]
    ],
    "excludes": [
      [
        2,
        2
      ],
      [
        4,
        4
      ]
    ],
    "halves": [],
    "decoys": [],
    "difficulty": 2,
    "source": "hand"
  },
  {
    "id": "04",
    "size": 4,
    "adjacent": true,
    "regions": [
      "AAAB",
      "CABB",
      "CCDB",
      "CDDD"
    ],
    "solution": [
      [
        1,
        3
      ],
      [
        2,
        1
      ],
      [
        3,
        4
      ],
      [
        4,
        2
      ]
    ],
    "givens": [
      [
        1,
        3
      ]
    ],
    "excludes": [
      [
        2,
        2
      ]
    ],
    "halves": [],
    "decoys": [],
    "difficulty": 2,
    "source": "hand"
  },
  {
    "id": "05",
    "size": 5,
    "adjacent": true,
    "regions": [
      "AABBB",
      "AABCC",
      "ADDCC",
      "EEDDC",
      "EEEDD"
    ],
    "solution": [
      [
        1,
        1
      ],
      [
        2,
        3
      ],
      [
        3,
        5
      ],
      [
        4,
        2
      ],
      [
        5,
        4
      ]
    ],
    "givens": [
      [
        1,
        1
      ],
      [
        5,
        4
      ]
    ],
    "excludes": [
      [
        2,
        2
      ]
    ],
    "halves": [],
    "decoys": [],
    "difficulty": 2,
    "source": "hand"
  },
  {
    "id": "06",
    "size": 5,
    "adjacent": true,
    "regions": [
      "AAAAA",
      "BBBCC",
      "DDCCC",
      "DEEEC",
      "DDEEE"
    ],
    "solution": [
      [
        1,
        4
      ],
      [
        2,
        2
      ],
      [
        3,
        5
      ],
      [
        4,
        3
      ],
      [
        5,
        1
      ]
    ],
    "givens": [
      [
        2,
        2
      ]
    ],
    "excludes": [
      [
        3,
        2
      ],
      [
        4,
        1
      ],
      [
        5,
        3
      ]
    ],
    "halves": [],
    "decoys": [],
    "difficulty": 2,
    "source": "hand"
  },
  {
    "id": "07",
    "size": 5,
    "adjacent": true,
    "regions": [
      "AABBC",
      "AABBC",
      "ADDDC",
      "ADEEC",
      "ADEEE"
    ],
    "solution": [
      [
        1,
        3
      ],
      [
        2,
        5
      ],
      [
        3,
        1
      ],
      [
        4,
        4
      ],
      [
        5,
        2
      ]
    ],
    "givens": [
      [
        5,
        2
      ]
    ],
    "excludes": [
      [
        1,
        4
      ],
      [
        1,
        5
      ]
    ],
    "halves": [],
    "decoys": [],
    "difficulty": 2,
    "source": "hand"
  },
  {
    "id": "08",
    "size": 6,
    "adjacent": true,
    "regions": [
      "AAABBB",
      "AACCBB",
      "ACCCDD",
      "EECDDD",
      "EEFFFD",
      "EFFFFF"
    ],
    "solution": [
      [
        1,
        6
      ],
      [
        2,
        1
      ],
      [
        3,
        3
      ],
      [
        4,
        5
      ],
      [
        5,
        2
      ],
      [
        6,
        4
      ]
    ],
    "givens": [
      [
        5,
        2
      ],
      [
        6,
        4
      ]
    ],
    "excludes": [
      [
        1,
        1
      ],
      [
        1,
        5
      ],
      [
        2,
        3
      ]
    ],
    "halves": [],
    "decoys": [],
    "difficulty": 2,
    "source": "hand"
  },
  {
    "id": "09",
    "size": 6,
    "adjacent": true,
    "regions": [
      "ECCCCC",
      "EAACFC",
      "EAFFFF",
      "EADDFB",
      "EADDBB",
      "EADDBB"
    ],
    "solution": [
      [
        1,
        4
      ],
      [
        2,
        2
      ],
      [
        3,
        5
      ],
      [
        4,
        1
      ],
      [
        5,
        3
      ],
      [
        6,
        6
      ]
    ],
    "givens": [
      [
        1,
        4
      ]
    ],
    "excludes": [
      [
        2,
        1
      ],
      [
        3,
        6
      ],
      [
        4,
        3
      ],
      [
        5,
        6
      ]
    ],
    "halves": [],
    "decoys": [],
    "difficulty": 3,
    "source": "generated"
  },
  {
    "id": "10",
    "size": 6,
    "adjacent": true,
    "regions": [
      "DBBBBB",
      "DDFFFF",
      "DDFACC",
      "DDAACC",
      "AAAAEC",
      "EEEEEC"
    ],
    "solution": [
      [
        1,
        4
      ],
      [
        2,
        1
      ],
      [
        3,
        3
      ],
      [
        4,
        6
      ],
      [
        5,
        2
      ],
      [
        6,
        5
      ]
    ],
    "givens": [],
    "excludes": [
      [
        1,
        2
      ],
      [
        1,
        3
      ],
      [
        1,
        5
      ],
      [
        1,
        6
      ],
      [
        2,
        6
      ]
    ],
    "halves": [],
    "decoys": [],
    "difficulty": 3,
    "source": "generated"
  },
  {
    "id": "11",
    "size": 6,
    "adjacent": true,
    "regions": [
      "EEADBB",
      "EAADDB",
      "EAADBB",
      "ECADDB",
      "ECFFFF",
      "CCCFFF"
    ],
    "solution": [
      [
        1,
        3
      ],
      [
        2,
        5
      ],
      [
        3,
        1
      ],
      [
        4,
        6
      ],
      [
        5,
        4
      ],
      [
        6,
        2
      ]
    ],
    "givens": [
      [
        6,
        2
      ]
    ],
    "excludes": [
      [
        1,
        1
      ]
    ],
    "halves": [
      {
        "region": "B",
        "side": "S"
      }
    ],
    "decoys": [
      [
        2,
        4
      ]
    ],
    "difficulty": 3,
    "source": "generated"
  },
  {
    "id": "12",
    "size": 6,
    "adjacent": true,
    "regions": [
      "CCFBBB",
      "CCFBBD",
      "CFFFDD",
      "CCAFFD",
      "EAAADD",
      "EEEAAD"
    ],
    "solution": [
      [
        1,
        5
      ],
      [
        2,
        3
      ],
      [
        3,
        6
      ],
      [
        4,
        1
      ],
      [
        5,
        4
      ],
      [
        6,
        2
      ]
    ],
    "givens": [],
    "excludes": [
      [
        1,
        3
      ],
      [
        1,
        6
      ],
      [
        4,
        2
      ]
    ],
    "halves": [
      {
        "region": "C",
        "side": "S"
      },
      {
        "region": "D",
        "side": "N"
      }
    ],
    "decoys": [
      [
        5,
        1
      ]
    ],
    "difficulty": 3,
    "source": "generated"
  },
  {
    "id": "13",
    "size": 6,
    "adjacent": true,
    "regions": [
      "DDDDBB",
      "DDDFBB",
      "AADFFF",
      "EAAACF",
      "EACCCC",
      "EEEECC"
    ],
    "solution": [
      [
        1,
        3
      ],
      [
        2,
        6
      ],
      [
        3,
        4
      ],
      [
        4,
        2
      ],
      [
        5,
        5
      ],
      [
        6,
        1
      ]
    ],
    "givens": [],
    "excludes": [
      [
        1,
        1
      ],
      [
        1,
        5
      ],
      [
        1,
        6
      ],
      [
        2,
        4
      ],
      [
        2,
        5
      ],
      [
        5,
        2
      ],
      [
        5,
        4
      ]
    ],
    "halves": [],
    "decoys": [
      [
        6,
        3
      ]
    ],
    "difficulty": 4,
    "source": "generated"
  },
  {
    "id": "14",
    "size": 6,
    "adjacent": true,
    "regions": [
      "FFFFDD",
      "CFFDDD",
      "CCADBB",
      "CCADBB",
      "CAAAEE",
      "CAAAEE"
    ],
    "solution": [
      [
        1,
        2
      ],
      [
        2,
        4
      ],
      [
        3,
        1
      ],
      [
        4,
        5
      ],
      [
        5,
        3
      ],
      [
        6,
        6
      ]
    ],
    "givens": [],
    "excludes": [
      [
        1,
        1
      ],
      [
        4,
        6
      ]
    ],
    "halves": [
      {
        "region": "B",
        "side": "S"
      },
      {
        "region": "D",
        "side": "N"
      }
    ],
    "decoys": [
      [
        1,
        3
      ]
    ],
    "difficulty": 4,
    "source": "generated"
  },
  {
    "id": "15",
    "size": 7,
    "adjacent": true,
    "regions": [
      "AAAFFFF",
      "CAAFFFF",
      "CAADDDF",
      "CAGDGDD",
      "CCGGGGD",
      "EEEBGGB",
      "EEEBBBB"
    ],
    "solution": [
      [
        1,
        7
      ],
      [
        2,
        1
      ],
      [
        3,
        3
      ],
      [
        4,
        6
      ],
      [
        5,
        4
      ],
      [
        6,
        2
      ],
      [
        7,
        5
      ]
    ],
    "givens": [
      [
        3,
        3
      ]
    ],
    "excludes": [
      [
        1,
        4
      ],
      [
        1,
        5
      ],
      [
        1,
        6
      ]
    ],
    "halves": [],
    "decoys": [
      [
        2,
        6
      ]
    ],
    "difficulty": 3,
    "source": "generated"
  },
  {
    "id": "16",
    "size": 7,
    "adjacent": true,
    "regions": [
      "CCCCEEE",
      "CCFAAEE",
      "FFFDAEE",
      "FFDDAAA",
      "FBBDDGA",
      "FBBBDGG",
      "BBBGGGG"
    ],
    "solution": [
      [
        1,
        7
      ],
      [
        2,
        1
      ],
      [
        3,
        5
      ],
      [
        4,
        2
      ],
      [
        5,
        4
      ],
      [
        6,
        6
      ],
      [
        7,
        3
      ]
    ],
    "givens": [],
    "excludes": [
      [
        1,
        1
      ],
      [
        1,
        2
      ],
      [
        1,
        3
      ],
      [
        1,
        4
      ],
      [
        1,
        6
      ],
      [
        2,
        2
      ]
    ],
    "halves": [
      {
        "region": "A",
        "side": "N"
      }
    ],
    "decoys": [
      [
        2,
        6
      ]
    ],
    "difficulty": 4,
    "source": "generated"
  },
  {
    "id": "17",
    "size": 7,
    "adjacent": true,
    "regions": [
      "EEGGGBB",
      "EEGGGBB",
      "EEAADBB",
      "CEAADDD",
      "CAAADDD",
      "CCCFDFF",
      "CCCFFFF"
    ],
    "solution": [
      [
        1,
        3
      ],
      [
        2,
        7
      ],
      [
        3,
        4
      ],
      [
        4,
        2
      ],
      [
        5,
        5
      ],
      [
        6,
        1
      ],
      [
        7,
        6
      ]
    ],
    "givens": [],
    "excludes": [
      [
        2,
        6
      ],
      [
        4,
        1
      ],
      [
        5,
        6
      ]
    ],
    "halves": [
      {
        "region": "A",
        "side": "N"
      },
      {
        "region": "D",
        "side": "S"
      }
    ],
    "decoys": [
      [
        2,
        2
      ]
    ],
    "difficulty": 4,
    "source": "generated"
  },
  {
    "id": "18",
    "size": 8,
    "adjacent": true,
    "regions": [
      "BBFCCCCC",
      "BBFFFCCC",
      "BBBFFHCH",
      "GBFFFHHH",
      "GBDDHHEE",
      "GDDDHEEE",
      "GGAAAAAE",
      "GGGAAEEE"
    ],
    "solution": [
      [
        1,
        7
      ],
      [
        2,
        5
      ],
      [
        3,
        2
      ],
      [
        4,
        6
      ],
      [
        5,
        3
      ],
      [
        6,
        1
      ],
      [
        7,
        8
      ],
      [
        8,
        4
      ]
    ],
    "givens": [
      [
        2,
        5
      ],
      [
        6,
        1
      ]
    ],
    "excludes": [
      [
        4,
        1
      ],
      [
        5,
        4
      ],
      [
        7,
        4
      ]
    ],
    "halves": [],
    "decoys": [
      [
        4,
        8
      ],
      [
        6,
        2
      ]
    ],
    "difficulty": 3,
    "source": "generated"
  },
  {
    "id": "19",
    "size": 8,
    "adjacent": true,
    "regions": [
      "FCCCCEEE",
      "FFFFCCEG",
      "FFHHCEEG",
      "FHHHHHEG",
      "BBHDAAAG",
      "BBBDAAGG",
      "BBDDAAGG",
      "BBDDAAGG"
    ],
    "solution": [
      [
        1,
        5
      ],
      [
        2,
        7
      ],
      [
        3,
        1
      ],
      [
        4,
        8
      ],
      [
        5,
        3
      ],
      [
        6,
        6
      ],
      [
        7,
        4
      ],
      [
        8,
        2
      ]
    ],
    "givens": [],
    "excludes": [
      [
        1,
        1
      ],
      [
        1,
        7
      ],
      [
        2,
        8
      ],
      [
        3,
        2
      ],
      [
        3,
        8
      ],
      [
        5,
        8
      ],
      [
        7,
        2
      ]
    ],
    "halves": [
      {
        "region": "G",
        "side": "N"
      }
    ],
    "decoys": [
      [
        6,
        3
      ],
      [
        6,
        5
      ]
    ],
    "difficulty": 4,
    "source": "generated"
  },
  {
    "id": "20",
    "size": 8,
    "adjacent": true,
    "regions": [
      "EGGGGGGB",
      "EEEEGBBB",
      "EEEBBBBD",
      "CCCFFFFD",
      "CCCFFDDD",
      "CCCFFDHD",
      "AAHHHHHD",
      "AAAAHHHD"
    ],
    "solution": [
      [
        1,
        5
      ],
      [
        2,
        1
      ],
      [
        3,
        4
      ],
      [
        4,
        7
      ],
      [
        5,
        2
      ],
      [
        6,
        8
      ],
      [
        7,
        6
      ],
      [
        8,
        3
      ]
    ],
    "givens": [],
    "excludes": [
      [
        1,
        6
      ],
      [
        2,
        2
      ],
      [
        4,
        6
      ],
      [
        5,
        3
      ]
    ],
    "halves": [
      {
        "region": "B",
        "side": "W"
      },
      {
        "region": "F",
        "side": "N"
      }
    ],
    "decoys": [
      [
        6,
        2
      ],
      [
        6,
        5
      ]
    ],
    "difficulty": 4,
    "source": "generated"
  },
  {
    "id": "21",
    "size": 8,
    "adjacent": true,
    "regions": [
      "HHEEBBBB",
      "HHEEBBFB",
      "HHEGGBFF",
      "HHEEGDFF",
      "HHCCGDDF",
      "CCCCGDFF",
      "AAAGGDDF",
      "AAAAGDDD"
    ],
    "solution": [
      [
        1,
        7
      ],
      [
        2,
        4
      ],
      [
        3,
        8
      ],
      [
        4,
        6
      ],
      [
        5,
        1
      ],
      [
        6,
        3
      ],
      [
        7,
        5
      ],
      [
        8,
        2
      ]
    ],
    "givens": [],
    "excludes": [
      [
        2,
        3
      ],
      [
        6,
        4
      ]
    ],
    "halves": [
      {
        "region": "E",
        "side": "N"
      },
      {
        "region": "G",
        "side": "S"
      },
      {
        "region": "H",
        "side": "S"
      }
    ],
    "decoys": [
      [
        1,
        2
      ],
      [
        5,
        5
      ]
    ],
    "difficulty": 5,
    "source": "generated"
  },
  {
    "id": "22",
    "size": 9,
    "adjacent": true,
    "regions": [
      "IIIIIEBBB",
      "GIIIIEBBB",
      "GGCCEEBBB",
      "GGCCEEEHH",
      "GGCCEEHHH",
      "GGCAAAHHF",
      "CCCADAHFF",
      "AAAADDDFF",
      "AADDDDDFF"
    ],
    "solution": [
      [
        1,
        2
      ],
      [
        2,
        9
      ],
      [
        3,
        5
      ],
      [
        4,
        1
      ],
      [
        5,
        3
      ],
      [
        6,
        7
      ],
      [
        7,
        4
      ],
      [
        8,
        6
      ],
      [
        9,
        8
      ]
    ],
    "givens": [
      [
        3,
        5
      ],
      [
        6,
        7
      ]
    ],
    "excludes": [
      [
        1,
        1
      ],
      [
        1,
        8
      ],
      [
        1,
        9
      ],
      [
        2,
        8
      ],
      [
        4,
        3
      ],
      [
        8,
        8
      ]
    ],
    "halves": [
      {
        "region": "I",
        "side": "W"
      }
    ],
    "decoys": [
      [
        2,
        3
      ],
      [
        7,
        9
      ]
    ],
    "difficulty": 4,
    "source": "generated"
  },
  {
    "id": "23",
    "size": 9,
    "adjacent": true,
    "regions": [
      "BBBBFFFFD",
      "BBFFFFDFD",
      "BBHHFADDD",
      "HHHHAADDD",
      "CCHHAAGGD",
      "CCCHAAGGI",
      "ECCCAGGII",
      "ECCEEEGII",
      "EEEEEEGII"
    ],
    "solution": [
      [
        1,
        2
      ],
      [
        2,
        4
      ],
      [
        3,
        8
      ],
      [
        4,
        6
      ],
      [
        5,
        3
      ],
      [
        6,
        1
      ],
      [
        7,
        7
      ],
      [
        8,
        5
      ],
      [
        9,
        9
      ]
    ],
    "givens": [],
    "excludes": [
      [
        1,
        1
      ],
      [
        1,
        9
      ],
      [
        3,
        6
      ],
      [
        3,
        9
      ],
      [
        4,
        5
      ],
      [
        7,
        9
      ],
      [
        8,
        9
      ]
    ],
    "halves": [
      {
        "region": "A",
        "side": "N"
      },
      {
        "region": "F",
        "side": "W"
      }
    ],
    "decoys": [
      [
        2,
        2
      ],
      [
        6,
        6
      ]
    ],
    "difficulty": 5,
    "source": "generated"
  },
  {
    "id": "24",
    "size": 9,
    "adjacent": true,
    "regions": [
      "BBBGGGEEE",
      "BGGGCGGEE",
      "BBGGCCCCE",
      "BBIIICCCE",
      "BIIIFFCEE",
      "BDIFFFAAA",
      "DDIFFFAAA",
      "DDDHHHAAA",
      "DDHHHHHAA"
    ],
    "solution": [
      [
        1,
        8
      ],
      [
        2,
        6
      ],
      [
        3,
        1
      ],
      [
        4,
        7
      ],
      [
        5,
        5
      ],
      [
        6,
        3
      ],
      [
        7,
        9
      ],
      [
        8,
        2
      ],
      [
        9,
        4
      ]
    ],
    "givens": [],
    "excludes": [
      [
        1,
        1
      ],
      [
        1,
        2
      ],
      [
        1,
        6
      ],
      [
        1,
        9
      ],
      [
        3,
        2
      ],
      [
        7,
        3
      ],
      [
        8,
        4
      ]
    ],
    "halves": [
      {
        "region": "G",
        "side": "E"
      },
      {
        "region": "I",
        "side": "S"
      }
    ],
    "decoys": [
      [
        2,
        1
      ],
      [
        6,
        2
      ]
    ],
    "difficulty": 5,
    "source": "generated"
  }
];
