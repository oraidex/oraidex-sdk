import { getAssetInfosFromPairString, getDate24hBeforeNow, validateOraiAddress } from "../src/helper";

describe("test-helper", () => {
  it("test-getDate24hBeforeNow", () => {
    // setup
    const now = new Date("2023-07-16T16:07:48.000Z");
    // act
    const result = getDate24hBeforeNow(now);
    // assert
    expect(result).toEqual(new Date("2023-07-15T16:07:48.000Z"));
  });

  it.each([
    ["orai", false],
    ["orai1234", false],
    ["abc", false],
    ["orai1lus0f0rhx8s03gdllx2n6vhkmf0536dv57wfge", true], // ORAIX
    ["orai12hzjxfh77wl572gdzct2fxv2arxcwh6gykc7qh", true] // USDT
  ])("test-validateContractAddress", (contractAddress, expected) => {
    const checkContractAddress = validateOraiAddress(contractAddress);
    // assert
    expect(checkContractAddress).toEqual(expected);
  });

  it.each([
    ["orai", null],
    [
      "orai-orai12hzjxfh77wl572gdzct2fxv2arxcwh6gykc7qh",
      [{ native_token: { denom: "orai" } }, { token: { contract_addr: "orai12hzjxfh77wl572gdzct2fxv2arxcwh6gykc7qh" } }]
    ],
    [
      "orai15un8msx3n5zf9ahlxmfeqd2kwa5wm0nrpxer304m9nd5q6qq0g6sku5pdd-orai1lus0f0rhx8s03gdllx2n6vhkmf0536dv57wfge",
      [
        {
          token: { contract_addr: "orai1lus0f0rhx8s03gdllx2n6vhkmf0536dv57wfge" }
        },
        {
          token: { contract_addr: "orai15un8msx3n5zf9ahlxmfeqd2kwa5wm0nrpxer304m9nd5q6qq0g6sku5pdd" }
        }
      ]
    ],
    [
      "orai1lus0f0rhx8s03gdllx2n6vhkmf0536dv57wfge-orai15un8msx3n5zf9ahlxmfeqd2kwa5wm0nrpxer304m9nd5q6qq0g6sku5pdd",
      [
        {
          token: { contract_addr: "orai1lus0f0rhx8s03gdllx2n6vhkmf0536dv57wfge" }
        },
        {
          token: { contract_addr: "orai15un8msx3n5zf9ahlxmfeqd2kwa5wm0nrpxer304m9nd5q6qq0g6sku5pdd" }
        }
      ]
    ]
  ])("test-getAssetInfosFromPairString", (contractAddress, expected) => {
    // act
    const result = getAssetInfosFromPairString(contractAddress);

    // assert
    expect(result).toEqual(expected);
  });
});
