import { useEffect, useState, useRef } from "react";
import styles from "../../styles/home/sidebar.module.css";
import { fetchMapPlaceData } from "../../utils/api";
import remove from "../../assets/icon/remove-filled.svg";

const Sidebar = ({
  isSidebarOpen,
  toggleSidebar,
  lat,
  lng,
  location,
  getMyLocation,
  clickedLocation,
}) => {
  const [isRotated, setIsRotated] = useState(false); // 새로고침버튼 회전 여부
  const [isModalOpen, setIsModalOpen] = useState(false); // 북마크 모달창 여부
  const [bookmarkName, setBookmarkName] = useState(""); // 북마크 이름
  const [isDisplayed, setIsDisplayed] = useState(true); // 대피소 정보 표시 여부
  const [bookmarks, setBookmarks] = useState(
    JSON.parse(localStorage.getItem("bookmarks")) ?? []
  ); // Store bookmarks
  const nearbyShelterRef = useRef([]); // 주변 대피소 정보
  const [bookmarkItemsVisible, setBookmarkItemsVisible] = useState(
    Array(bookmarks.length).fill(false)
  ); // State variable to track the visibility of bookmark items
  const [isRemoveToggle, setIsRemoveToggle] = useState(false); // 북마크 삭제버튼 클릭 여부

  // Toggle the visibility of bookmark items for a given index
  const toggleBookmarkItems = (index) => {
    setBookmarkItemsVisible((prevVisible) => {
      const newVisible = [...prevVisible];
      newVisible[index] = !newVisible[index];
      return newVisible;
    });
  };

  const removeBookmark = (index) => {
    setBookmarks((prev) => {
      const updatedBookmarks = [...prev];
      updatedBookmarks.splice(index, 1);
      return updatedBookmarks;
    });
  };

  let topValue;

  if (isDisplayed) {
    topValue =
      70 +
      50 *
        (nearbyShelterRef.current?.length === 0
          ? 1
          : nearbyShelterRef.current?.length);
  } else {
    topValue = 70;
  }

  const refresh = () => {
    setIsRotated(true);
    getMyLocation();
    setTimeout(() => {
      setIsRotated(false);
    }, 500);
  };

  const handleBookmarkSave = async () => {
    const filteredShelter = await fetchMapPlaceData().then((data) =>
      data
        .filter(
          (item) =>
            item.lat > clickedLocation.lat - 0.01 &&
            item.lat < clickedLocation.lat + 0.01 &&
            item.lng > clickedLocation.lng - 0.01 &&
            item.lng < clickedLocation.lng + 0.01
        )
        .slice(0, 10)
    );

    const newBookmark = {
      name: bookmarkName,
      location: clickedLocation,
      shelter: filteredShelter,
    };

    setBookmarks((prev) => [...prev, newBookmark]);
    setIsModalOpen(false);
    setBookmarkName("");
  };

  useEffect(() => {
    fetchMapPlaceData().then((data) => {
      if (
        location !== "위치정보없음" ||
        location.indexOf("서울특별시") !== -1
      ) {
        const filteredShelter = data.filter((item) => {
          return (
            item.lat > lat - 0.01 &&
            item.lat < lat + 0.01 &&
            item.lng > lng - 0.01 &&
            item.lng < lng + 0.01
          );
        });

        nearbyShelterRef.current = filteredShelter.slice(0, 10); // Store the value in the useRef

        /* console.log(nearbyShelterRef.current);
      console.log(lat, lng, location); */
      }
    });
  }, [location]);

  useEffect(() => {
    localStorage.setItem("bookmarks", JSON.stringify(bookmarks));
  }, [bookmarks]);

  return (
    <>
      {/* 사이드바 오픈 */}
      <button
        className={`${styles.bookmark_button} ${
          isSidebarOpen ? styles.open : ""
        }`}
        onClick={toggleSidebar}
      >
        ⭐
      </button>

      {/* 위치 북마크 모달 */}
      {isModalOpen && (
        <div className={styles.modal_overlay}>
          <div className={styles.modal_content}>
            <button
              className={styles.close_button}
              onClick={() => setIsModalOpen(false)}
            >
              &times;
            </button>
            <label>
              저장 이름
              <input
                type="text"
                className={styles.modal_input}
                value={bookmarkName}
                onChange={(e) => setBookmarkName(e.target.value)}
                placeholder="저장할 이름을 입력하세요."
              />
            </label>
            <label>
              저장 위치
              <input
                type="text"
                className={styles.modal_input}
                defaultValue={clickedLocation?.address}
                placeholder="지도에서 클릭한 위치가 표시됩니다."
              />
            </label>
            <p>
              <button
                className={styles.modal_button}
                onClick={handleBookmarkSave}
              >
                저장
              </button>
              <button
                className={styles.modal_button}
                onClick={() => setIsModalOpen(false)}
              >
                취소
              </button>
            </p>
          </div>
        </div>
      )}

      {/* 사이드바 */}
      <div className={`${styles.sidebar} ${isSidebarOpen ? styles.open : ""}`}>
        <div
          className={`${styles.bookmark_refresh} ${
            isRotated ? styles.rotate : ""
          }`}
          onClick={refresh}
        ></div>
        <div
          className={styles.bookmark_add}
          onClick={() => setIsModalOpen(true)}
        ></div>
        <div
          className={styles.bookmark_remove}
          onClick={() => setIsRemoveToggle((prev) => !prev)}
        ></div>

        <div className={styles.my_location_container}>
          <div
            className={styles.my_location}
            onClick={() => setIsDisplayed(!isDisplayed)}
          >
            <span className={styles.my_location_title}>현재 위치</span>
            <div className={styles.my_location_name}>{location}</div>
            {nearbyShelterRef.current?.length !== 0 ? (
              nearbyShelterRef.current.map((item, idx) => (
                <div
                  className={`${styles.my_location_item} ${
                    isDisplayed ? styles.displayed : ""
                  }`}
                  style={{ top: `${70 + 50 * idx}px` }}
                >
                  {item.name}
                </div>
              ))
            ) : (
              <div
                className={`${styles.my_location_item} ${
                  isDisplayed ? styles.displayed : ""
                }`}
                style={{ top: "70px" }}
              >
                주변 대피소 조회 불가
              </div>
            )}
          </div>

          {/* Display Bookmarks */}
          {bookmarks?.length > 0 &&
            bookmarks.map((bookmark, index) => {
              let additionalOffset = 0;

              if (index > 0) {
                for (let i = index - 1; i >= 0; i--) {
                  additionalOffset +=
                    50 *
                    (bookmarkItemsVisible[i]
                      ? bookmarks[i]?.shelter?.length
                      : 0);
                }
              }

              return (
                <div
                  className={styles.my_location}
                  style={{
                    top: `${topValue + 70 * index + additionalOffset}px`,
                  }}
                  key={`${bookmark.name}_${bookmark.location.lat}`}
                  onClick={() => toggleBookmarkItems(index)}
                >
                  <div className={styles.my_location_title}>
                    {bookmark.name}
                    {isRemoveToggle && (
                      <div
                        className={styles.bookmark_remove_item}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeBookmark(index);
                        }}
                      ></div>
                    )}
                  </div>
                  <div className={styles.my_location_name}>
                    {bookmark.location?.address}
                  </div>
                  {bookmark.shelter.map((item, idx) => (
                    <div
                      className={`${styles.my_location_item} ${
                        bookmarkItemsVisible[index] ? styles.displayed : ""
                      }`}
                      style={{ top: `${70 + 50 * idx}px` }}
                      key={`${item.name}_${idx}`}
                    >
                      {item.name}
                    </div>
                  ))}
                </div>
              );
            })}

          {/* <div className={styles.sticky_note}></div> */}
        </div>
      </div>
    </>
  );
};

export default Sidebar;