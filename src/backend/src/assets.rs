use ic_asset_certification::{Asset, AssetConfig, AssetEncoding, AssetFallbackConfig, AssetRouter};
use ic_cdk::api::{certified_data_set, data_certificate};
use ic_http_certification::{HttpRequest, HttpResponse, StatusCode};
use include_dir::{include_dir, Dir};
use std::cell::RefCell;

static ASSETS_DIR: Dir<'_> = include_dir!("$CARGO_MANIFEST_DIR/../frontend/dist");

thread_local! {
    static ASSET_ROUTER: RefCell<AssetRouter<'static>> = RefCell::new(AssetRouter::default());
}

pub fn certify_all_assets() {
    let asset_configs = vec![
        AssetConfig::File {
            path: "index.html".to_string(),
            content_type: Some("text/html".to_string()),
            headers: vec![(
                "cache-control".to_string(),
                "public, no-cache, no-store".to_string(),
            )],
            fallback_for: vec![AssetFallbackConfig {
                status_code: Some(StatusCode::OK),
                scope: "/".to_string(),
            }],
            aliased_by: vec!["/".to_string()],
            encodings: vec![
                AssetEncoding::Brotli.default_config(),
                AssetEncoding::Gzip.default_config(),
            ],
        },
        AssetConfig::File {
            path: ".well-known/ic-domains".to_string(),
            content_type: Some("text/plain".to_string()),
            headers: vec![(
                "cache-control".to_string(),
                "public, no-cache, no-store".to_string(),
            )],
            fallback_for: vec![],
            aliased_by: vec![],
            encodings: vec![
                AssetEncoding::Brotli.default_config(),
                AssetEncoding::Gzip.default_config(),
            ],
        },
        AssetConfig::Pattern {
            pattern: "**/*.js".to_string(),
            content_type: Some("text/javascript".to_string()),
            headers: vec![(
                "cache-control".to_string(),
                "public, max-age=31536000, immutable".to_string(),
            )],
            encodings: vec![
                AssetEncoding::Brotli.default_config(),
                AssetEncoding::Gzip.default_config(),
            ],
        },
        AssetConfig::Pattern {
            pattern: "**/*.css".to_string(),
            content_type: Some("text/css".to_string()),
            headers: vec![(
                "cache-control".to_string(),
                "public, max-age=31536000, immutable".to_string(),
            )],
            encodings: vec![
                AssetEncoding::Brotli.default_config(),
                AssetEncoding::Gzip.default_config(),
            ],
        },
        AssetConfig::Pattern {
            pattern: "**/*.ico".to_string(),
            content_type: Some("image/x-icon".to_string()),
            headers: vec![(
                "cache-control".to_string(),
                "public, max-age=31536000, immutable".to_string(),
            )],
            encodings: vec![
                AssetEncoding::Brotli.default_config(),
                AssetEncoding::Gzip.default_config(),
            ],
        },
        AssetConfig::Pattern {
            pattern: "**/*.svg".to_string(),
            content_type: Some("image/svg+xml".to_string()),
            headers: vec![(
                "cache-control".to_string(),
                "public, max-age=31536000, immutable".to_string(),
            )],
            encodings: vec![
                AssetEncoding::Brotli.default_config(),
                AssetEncoding::Gzip.default_config(),
            ],
        },
    ];

    let mut assets = Vec::new();
    collect_assets(&ASSETS_DIR, &mut assets);

    ASSET_ROUTER.with_borrow_mut(|asset_router| {
        if let Err(err) = asset_router.certify_assets(assets, asset_configs) {
            ic_cdk::trap(format!("Failed to certify assets: {err}"));
        }

        certified_data_set(asset_router.root_hash());
    });
}

pub fn serve_asset(req: &HttpRequest) -> HttpResponse<'static> {
    ASSET_ROUTER.with_borrow(|asset_router| {
        if let Ok(response) = asset_router.serve_asset(
            &data_certificate().expect("No data certificate available"),
            req,
        ) {
            response
        } else {
            ic_cdk::trap("Failed to serve asset");
        }
    })
}

fn collect_assets<'content, 'path>(
    dir: &'content Dir<'path>,
    assets: &mut Vec<Asset<'content, 'path>>,
) {
    for file in dir.files() {
        assets.push(Asset::new(file.path().to_string_lossy(), file.contents()));
    }

    for dir in dir.dirs() {
        collect_assets(dir, assets);
    }
}
