import GoogleMobileAds
import UIKit

/// A compact native ad that matches the game's dark-and-gold cards: media, headline, body, call to action
/// and an "Ad" badge. Google's AdChoices icon is added automatically by the SDK.
final class NativeAdCard: NativeAdView {
    private let media = MediaView()
    private let icon = UIImageView()
    private let headline = UILabel()
    private let body = UILabel()
    private let action = UIButton(type: .system)
    private let badge = UILabel()
    private(set) var hasAd = false

    init() {
        super.init(frame: .zero)
        backgroundColor = UIColor(red: 0.11, green: 0.08, blue: 0.18, alpha: 1)
        layer.cornerRadius = 12
        layer.borderWidth = 1
        layer.borderColor = UIColor(red: 0.91, green: 0.64, blue: 0.24, alpha: 0.55).cgColor
        clipsToBounds = true

        media.contentMode = .scaleAspectFill
        media.clipsToBounds = true
        media.layer.cornerRadius = 8
        icon.contentMode = .scaleAspectFit
        icon.layer.cornerRadius = 6
        icon.clipsToBounds = true

        headline.font = .systemFont(ofSize: 15, weight: .bold)
        headline.textColor = UIColor(red: 1, green: 0.95, blue: 0.77, alpha: 1)
        headline.numberOfLines = 2
        body.font = .systemFont(ofSize: 12)
        body.textColor = UIColor(white: 0.85, alpha: 1)
        body.numberOfLines = 2

        action.titleLabel?.font = .systemFont(ofSize: 13, weight: .bold)
        action.setTitleColor(UIColor(red: 0.16, green: 0.09, blue: 0.02, alpha: 1), for: .normal)
        action.backgroundColor = UIColor(red: 0.95, green: 0.72, blue: 0.29, alpha: 1)
        action.layer.cornerRadius = 8
        action.contentEdgeInsets = UIEdgeInsets(top: 4, left: 12, bottom: 4, right: 12)
        action.isUserInteractionEnabled = false  // the SDK handles the tap

        badge.text = "Ad"
        badge.font = .systemFont(ofSize: 10, weight: .heavy)
        badge.textColor = UIColor(red: 0.16, green: 0.09, blue: 0.02, alpha: 1)
        badge.backgroundColor = UIColor(red: 0.95, green: 0.72, blue: 0.29, alpha: 1)
        badge.textAlignment = .center
        badge.layer.cornerRadius = 3
        badge.clipsToBounds = true

        [media, icon, headline, body, action, badge].forEach(addSubview)
        mediaView = media
        iconView = icon
        headlineView = headline
        bodyView = body
        callToActionView = action
    }

    required init?(coder: NSCoder) { fatalError("init(coder:) is not used") }

    func show(_ ad: NativeAd) {
        headline.text = ad.headline
        body.text = ad.body
        body.isHidden = ad.body == nil
        icon.image = ad.icon?.image
        icon.isHidden = ad.icon == nil
        action.setTitle(ad.callToAction ?? "Open", for: .normal)
        action.isHidden = ad.callToAction == nil
        media.mediaContent = ad.mediaContent
        nativeAd = ad
        hasAd = true
        setNeedsLayout()
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        let pad: CGFloat = 10
        let side = bounds.height - pad * 2               // square media on the left (at least 120 pt in a 150 pt slot)
        media.frame = CGRect(x: pad, y: pad, width: side, height: side)
        let x = media.frame.maxX + pad
        let w = bounds.width - x - pad
        badge.frame = CGRect(x: x, y: pad, width: 22, height: 14)
        if icon.isHidden {
            headline.frame = CGRect(x: x + 28, y: pad - 2, width: w - 28, height: 40)
        } else {
            icon.frame = CGRect(x: x + 28, y: pad - 2, width: 24, height: 24)
            headline.frame = CGRect(x: x + 58, y: pad - 2, width: w - 58, height: 40)
        }
        body.frame = CGRect(x: x, y: headline.frame.maxY + 2, width: w, height: 32)
        let size = action.sizeThatFits(CGSize(width: w, height: 30))
        action.frame = CGRect(x: x + w - min(w, size.width + 24), y: bounds.height - pad - 30, width: min(w, size.width + 24), height: 30)
    }
}
