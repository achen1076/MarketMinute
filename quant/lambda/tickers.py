"""Market tickers for analysis"""

TICKERS = [
    # MEGA CAP & MAGNIFICENT SEVEN
    "NVDA", "AAPL", "GOOGL", "MSFT", "AMZN", "META", "TSLA", "AVGO", "LLY",

    # TOP LARGE CAP & SECTOR LEADERS
    "JPM", "WMT", "V", "ORCL", "MA", "XOM", "JNJ", "PLTR", "NFLX", "BAC", "ABBV", "COST",
    "AMD", "HD", "PG", "GE", "MU", "CSCO", "CVX", "UNH", "KO", "WFC", "MS", "IBM", "CAT",
    "CRM", "ADBE", "ACN", "PM", "QCOM", "LIN", "TXN", "VZ", "RTX", "AMGN", "DIS", "T",
    "INTC", "ISRG", "NEE", "LOW", "PFE", "HON", "AXP", "BKNG", "SPGI", "UNP", "SYK", "GS",

    # HIGH VOLUME & S&P 500 (ALPHABETICAL REMAINDER)
    "A", "AAL", "AAP", "ABNB", "ABT", "ACGL", "ADI", "ADM", "ADSK", "AEE", "AEP", "AES",
    "AFL", "AFRM", "AG", "AGNC", "AIG", "AIZ", "AJG", "AKAM", "ALB", "ALGN", "ALL", "ALLE",
    "AMAT", "AMCR", "AME", "AMR", "AMT", "ANET", "AON", "AOS", "APA", "APD", "APH",
    "APO", "ARE", "ARKG", "ATO", "AVY", "AWK", "AXON", "AZO", "BA", "BALL", "BAX", "BBWI",
    "BBY", "BDX", "BEN", "BF.B", "BIIB", "BIO", "BITF", "BK", "BKR", "BLK", "BMY", "BSX",
    "BTU", "BXP", "C", "CAG", "CAH", "CARR", "CB", "CBOE", "CBRE", "CCI", "CCL", "CDNS",
    "CDW", "CE", "CEG", "CF", "CFG", "CHD", "CHKP", "CHTR", "CI", "CINF", "CL", "CLX",
    "CMA", "CMCSA", "CME", "CMG", "CMI", "CMS", "CNC", "CNP", "COF", "COIN", "COP", "CPB",
    "CPRT", "CPT", "CRL", "CRWD", "CSGP", "CSX", "CTAS", "CTRA", "CTSH", "CTVA", "CVS",
    "D", "DAL", "DD", "DDOG", "DE", "DECK", "DG", "DGX", "DHI", "DHR", "DLR", "DLTR",
    "DOCU", "DOV", "DOW", "DPZ", "DRI", "DTE", "DUK", "DVA", "DVN", "DXCM", "EA", "EBAY",
    "ECL", "ED", "EFX", "EG", "EIX", "EL", "ELV", "EMN", "EMR", "ENPH", "EOG", "EPAM",
    "EQIX", "EQR", "EQT", "ES", "ESS", "ETN", "ETR", "EVRG", "EW", "EXAS", "EXC", "EXPD",
    "EXPE", "EXR", "F", "FANG", "FAST", "FCX", "FDS", "FE", "FICO", "FIS", "FITB",
    "FMC", "FOX", "FOXA", "FRT", "FTNT", "FTV", "GD", "GDDY", "GEHC", "GEN", "GILD", "GIS",
    "GL", "GLW", "GM", "GMAB", "GNRC", "GPC", "GPN", "GRMN", "HAL", "HAS",
    "HBAN", "HCA", "HIG", "HII", "HLT", "HOLX", "HOOD", "HPQ", "HRL", "HSIC", "HST",
    "HSY", "HUBB", "HUM", "HWM", "IEX", "IFF", "ILMN", "INCY", "INVH", "IP", "IQV",
    "IREN", "IRM", "IT", "ITW", "IVZ", "J", "JBHT", "JBLU", "JCI", "JKHY",
    "KDP", "KEY", "KHC", "KIM", "KLAC", "KMB", "KMI", "KMX", "KR", "KSS", "L", "LDOS",
    "LEN", "LH", "LHX", "LKQ", "LMT", "LNC", "LNT", "LRCX", "LULU", "LUV", "LVS",
    "LW", "LYB", "LYV", "M", "MAA", "MAR", "MARA", "MAS", "MCK", "MCO", "MCD", "MDB",
    "MDT", "MET", "MGM", "MHK", "MKC", "MKTX", "MLM", "MMC", "MMM", "MNST", "MO", "MOH",
    "MOS", "MPC", "MPWR", "MRNA", "MSI", "MSTR", "MTB", "MTCH", "MTD", "NCLH",
    "NDAQ", "NDSN", "NEM", "NET", "NI", "NKE", "NOC", "NOW", "NRG", "NSC", "NTRS", "NUE",
    "NVAX", "NVCR", "NVR", "NWL", "NWS", "NWSA", "NXPI", "O", "ODFL", "OKE", "OKTA",
    "OMC", "ON", "ORLY", "OTIS", "OXY", "PANW", "PATH", "PAYC", "PAYX", "PCAR",
    "PCG", "PEG", "PEP", "PGR", "PH", "PHM", "PKG", "PLD", "PNC",
    "PNR", "PNW", "POOL", "PPG", "PPL", "PRU", "PSA", "PSX", "PTC", "PUBM", "PYPL",
    "QRVO", "RCL", "REG", "REGN", "RF", "RHI", "RJF", "RL", "RMD", "ROK", "ROL", "ROP",
    "ROST", "RSG", "RVTY", "SBAC", "SBUX", "SCHW", "SHW", "SHOP", "SJM", "SLB",
    "SNA", "SNOW", "SO", "SOFI", "SPG", "STAG", "STE", "STLD", "STT", "STX", "STZ", "SWK",
    "SWKS", "SYF", "SYY", "TAP", "TDG", "TDOC", "TDY", "TEAM", "TECH", "TEL", "TER",
    "TFC", "TFX", "TGT", "TJX", "TMO", "TROW", "TRV", "TRGP", "TSCO", "TSN", "TT", "TTD",
    "TTWO", "TXT", "TYL", "UAL", "UDR", "UHS", "ULTA", "UPS", "URI", "USB",
    "VCYT", "VFC", "VICI", "VLO", "VMC", "VNO", "VRSK", "VRSN", "VRTX", "VTR", "VTRS",
    "WAB", "WAT", "WBD", "WDC", "WEC", "WELL", "WHR", "WM", "WMB",
    "WRB", "WST", "WTW", "WY", "WYNN", "XEL", "XRAY", "XYL", "YUM", "ZBH", "ZBRA",
    "ZION", "ZM", "ZS", "ZTS",

    # ADDED MID-CAPS & LIQUID GROWTH
    "IBIT", "BITX", "RIOT", "UPST", "DKNG", "LCID", "RIVN", "APP", "PINS",
    "SE", "CPNG", "GRAB", "TOST", "DUOL", "RDDT", "HIMS", "SOUN", "BBAI", "RKLB", "ASTS",
    "IONQ", "RGTI", "QBTS", "OKLO", "SMR", "VRT", "SMCI", "MNDY",
]
